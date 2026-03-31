import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

import { ok } from "../common/api.js";
import { CurrentUser, type AuthenticatedRequestUser } from "../common/decorators/current-user.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { parseDeviceType, parsePhotoSessionStatus } from "../common/prisma-enums.js";
import { serializePhotoAsset, serializePhotoSession } from "../common/serializers.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { LocalStorageService } from "../storage/local-storage.service.js";

class CreatePhotoSessionDto {
  @IsString()
  locationId!: string;

  @IsOptional()
  @IsString()
  deviceType?: string;
}

class UpdatePhotoSessionStatusDto {
  @IsString()
  status!: string;
}

@Injectable()
class PhotoSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService
  ) {}

  async create(userId: string, dto: CreatePhotoSessionDto) {
    const session = await this.prisma.photoSession.create({
      data: {
        userId,
        locationId: dto.locationId,
        deviceType: parseDeviceType(dto.deviceType)
      }
    });

    return serializePhotoSession(session);
  }

  async getOne(sessionId: string, user: AuthenticatedRequestUser) {
    const session = await this.prisma.photoSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        photoAssets: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (user.role !== "admin" && session.userId !== user.id) {
      throw new ForbiddenException("You cannot access this photo session.");
    }

    return {
      ...serializePhotoSession(session),
      assets: session.photoAssets.map((asset) => serializePhotoAsset(asset, this.storage))
    };
  }

  async updateStatus(sessionId: string, status: string) {
    const session = await this.prisma.photoSession.update({
      where: { id: sessionId },
      data: {
        status: parsePhotoSessionStatus(status)
      }
    });

    return serializePhotoSession(session);
  }
}

@ApiTags("Photo Sessions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("photo-sessions")
class PhotoSessionsController {
  constructor(private readonly photoSessionsService: PhotoSessionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new photo session" })
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreatePhotoSessionDto) {
    return this.photoSessionsService.create(user.id, dto).then((data) => ok(data));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get photo session details" })
  getOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.photoSessionsService.getOne(id, user).then((data) => ok(data));
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  updateStatus(@Param("id") id: string, @Body() dto: UpdatePhotoSessionStatusDto) {
    return this.photoSessionsService.updateStatus(id, dto.status).then((data) => ok(data));
  }
}

@Module({
  controllers: [PhotoSessionsController],
  providers: [PhotoSessionsService]
})
export class PhotoSessionsModule {}
