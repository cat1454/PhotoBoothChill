import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PhotoProcessingStatus } from "@prisma/client";
import { IsString } from "class-validator";

import { ok } from "../common/api.js";
import { CurrentUser, type AuthenticatedRequestUser } from "../common/decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { serializePassportStamp, serializeUser } from "../common/serializers.js";
import { PrismaService } from "../prisma/prisma.service.js";

class CheckInDto {
  @IsString()
  locationId!: string;

  @IsString()
  photoId!: string;
}

@Injectable()
class PassportService {
  constructor(private readonly prisma: PrismaService) {}

  async me(user: AuthenticatedRequestUser) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    const stamps = await this.prisma.passportStamp.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: "desc" }
    });

    return {
      user: serializeUser(dbUser),
      totalStamps: stamps.length,
      stamps: stamps.map(serializePassportStamp)
    };
  }

  async stamps(user: AuthenticatedRequestUser) {
    const stamps = await this.prisma.passportStamp.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: "desc" }
    });

    return stamps.map(serializePassportStamp);
  }

  async checkIn(user: AuthenticatedRequestUser, dto: CheckInDto) {
    const asset = await this.prisma.photoAsset.findUniqueOrThrow({
      where: { id: dto.photoId },
      include: { session: true }
    });

    if (asset.session.userId !== user.id) {
      throw new BadRequestException("Photo does not belong to current user.");
    }

    if (asset.session.locationId !== dto.locationId) {
      throw new BadRequestException("Photo location does not match requested stamp location.");
    }

    if (asset.processingStatus !== PhotoProcessingStatus.PROCESSED) {
      throw new BadRequestException("Photo must be processed before check-in.");
    }

    const stamp = await this.prisma.passportStamp.upsert({
      where: {
        userId_locationId: {
          userId: user.id,
          locationId: dto.locationId
        }
      },
      update: {
        photoId: dto.photoId
      },
      create: {
        userId: user.id,
        locationId: dto.locationId,
        photoId: dto.photoId
      }
    });

    return serializePassportStamp(stamp);
  }
}

@ApiTags("Passport")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("passport")
class PassportController {
  constructor(private readonly passportService: PassportService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current passport summary" })
  me(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.passportService.me(user).then((data) => ok(data));
  }

  @Get("stamps")
  @ApiOperation({ summary: "List current user stamps" })
  stamps(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.passportService.stamps(user).then((data) => ok(data));
  }

  @Post("check-in")
  @ApiOperation({ summary: "Create or refresh a passport stamp" })
  checkIn(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CheckInDto) {
    return this.passportService.checkIn(user, dto).then((data) => ok(data));
  }
}

@Module({
  controllers: [PassportController],
  providers: [PassportService]
})
export class PassportModule {}
