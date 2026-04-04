import { Controller, Get, Injectable, Module, NotFoundException, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { ok, enumToApi } from "../common/api.js";
import { EnvService } from "../config/env.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { LocalStorageService } from "../storage/local-storage.service.js";

@Injectable()
class PublicPhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly env: EnvService
  ) {}

  private async findByToken(token: string) {
    const asset = await this.prisma.photoAsset.findUnique({
      where: { publicShareToken: token },
      include: {
        session: {
          include: {
            location: true
          }
        },
        selectedFrameTemplate: true
      }
    });

    if (!asset) {
      throw new NotFoundException("Download page not found.");
    }

    return asset;
  }

  private buildDownloadBase(token: string) {
    return `${this.env.apiPublicUrl}/api/v1/public/photos/${token}/downloads`;
  }

  async getDownloads(token: string) {
    const asset = await this.findByToken(token);
    const base = this.buildDownloadBase(token);

    return {
      locationName: asset.session.location.name,
      frameName: asset.selectedFrameTemplate?.name ?? null,
      previewUrl: asset.previewKey ? this.storage.getPublicUrl(asset.previewKey) : null,
      framedPhotoUrl: asset.processedKey ? `${base}/framed-photo` : null,
      originalsArchiveUrl: asset.originalsArchiveKey ? `${base}/originals` : null,
      animatedFrameUrl: asset.animatedFrameKey ? `${base}/animated-frame` : null,
      downloadPageUrl: `${this.env.webPublicUrl}/download/${token}`,
      status: enumToApi(asset.processingStatus)
    };
  }

  async streamDownload(token: string, kind: string, response: Response) {
    const asset = await this.findByToken(token);

    const mapping = {
      originals: {
        key: asset.originalsArchiveKey,
        filename: "all-captured-photos.zip"
      },
      "framed-photo": {
        key: asset.processedKey,
        filename: "framed-photo.jpg"
      },
      "animated-frame": {
        key: asset.animatedFrameKey,
        filename: "animated-frame.mp4"
      }
    } as const;

    const target = mapping[kind as keyof typeof mapping];
    if (!target?.key) {
      throw new NotFoundException("Requested file is not available.");
    }

    response.download(this.storage.resolvePath(target.key), target.filename);
  }
}

@ApiTags("Public")
@Controller("public/photos")
class PublicPhotosController {
  constructor(private readonly publicPhotosService: PublicPhotosService) {}

  @Get(":token/downloads")
  @ApiOperation({ summary: "Get public mobile download links for a processed photo" })
  getDownloads(@Param("token") token: string) {
    return this.publicPhotosService.getDownloads(token).then((data) => ok(data));
  }

  @Get(":token/downloads/:kind")
  @ApiOperation({ summary: "Download a public asset file by share token" })
  async downloadAsset(@Param("token") token: string, @Param("kind") kind: string, @Res() response: Response) {
    await this.publicPhotosService.streamDownload(token, kind, response);
  }
}

@Module({
  controllers: [PublicPhotosController],
  providers: [PublicPhotosService]
})
export class PublicModule {}