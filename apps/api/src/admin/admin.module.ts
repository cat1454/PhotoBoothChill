import { Controller, Get, Injectable, Module, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { ok } from "../common/api.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { serializePhotoAsset, serializePhotoSession, serializeUser, serializeLocation } from "../common/serializers.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { LocalStorageService } from "../storage/local-storage.service.js";

@Injectable()
class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService
  ) {}

  async listSessions() {
    const sessions = await this.prisma.photoSession.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        location: true,
        photoAssets: {
          orderBy: { createdAt: "desc" }
        }
      },
      take: 50
    });

    return sessions.map((session) => ({
      ...serializePhotoSession(session),
      user: serializeUser(session.user),
      location: serializeLocation(session.location),
      assets: session.photoAssets.map((asset) => serializePhotoAsset(asset, this.storage))
    }));
  }
}

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Controller("admin")
class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("sessions")
  @ApiOperation({ summary: "List recent photo sessions for admin" })
  listSessions() {
    return this.adminService.listSessions().then((data) => ok(data));
  }
}

@Module({
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
