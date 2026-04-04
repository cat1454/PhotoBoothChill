import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Module,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "node:crypto";

import { buildAssetKey, PHOTO_PROCESS_JOB_NAME } from "@photobooth/shared";
import { PhotoProcessingStatus, PhotoSessionStatus } from "@prisma/client";

import { ok } from "../common/api.js";
import { CurrentUser, type AuthenticatedRequestUser } from "../common/decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { serializePhotoAsset, serializePhotoSession } from "../common/serializers.js";
import { EnvService } from "../config/env.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { QueueService } from "../queue/queue.service.js";
import { LocalStorageService } from "../storage/local-storage.service.js";

class ProcessPhotoDto {
  @IsString()
  photoId!: string;

  @IsOptional()
  @IsString()
  frameTemplateId?: string;
}

@Injectable()
class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly queue: QueueService,
    private readonly env: EnvService
  ) {}

  private async findOwnedPhoto(photoId: string, user: AuthenticatedRequestUser) {
    const asset = await this.prisma.photoAsset.findUniqueOrThrow({
      where: { id: photoId },
      include: {
        session: true
      }
    });

    if (user.role !== "admin" && asset.session.userId !== user.id) {
      throw new ForbiddenException("You cannot access this photo asset.");
    }

    return asset;
  }

  async upload(user: AuthenticatedRequestUser, sessionId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Image file is required.");
    }

    const session = await this.prisma.photoSession.findUniqueOrThrow({
      where: { id: sessionId }
    });

    if (user.role !== "admin" && session.userId !== user.id) {
      throw new ForbiddenException("You cannot upload to this session.");
    }

    const extension = file.mimetype === "image/png" ? "png" : "jpg";
    const photoId = randomUUID();
    const originalKey = buildAssetKey("original", `${photoId}.${extension}`);

    await this.storage.putObject(originalKey, file.buffer);

    const asset = await this.prisma.photoAsset.create({
      data: {
        id: photoId,
        sessionId,
        originalKey,
        publicShareToken: randomUUID(),
        processingStatus: PhotoProcessingStatus.PENDING
      }
    });

    await this.prisma.photoSession.update({
      where: { id: sessionId },
      data: {
        status: PhotoSessionStatus.UPLOADED
      }
    });

    return {
      ...serializePhotoAsset(asset, this.storage),
      downloadPageUrl: asset.publicShareToken ? `${this.env.webPublicUrl}/download/${asset.publicShareToken}` : null
    };
  }

  async uploadSourceBundle(user: AuthenticatedRequestUser, photoId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Source bundle file is required.");
    }

    const asset = await this.findOwnedPhoto(photoId, user);
    const sourceBundleKey = buildAssetKey("source", `${asset.id}.zip`);
    await this.storage.putObject(sourceBundleKey, file.buffer);

    await this.prisma.photoAsset.update({
      where: { id: asset.id },
      data: {
        sourceBundleKey
      }
    });

    return {
      photoId: asset.id,
      sourceBundleUploaded: true
    };
  }

  async process(user: AuthenticatedRequestUser, dto: ProcessPhotoDto) {
    const asset = await this.findOwnedPhoto(dto.photoId, user);

    const updatedAsset = await this.prisma.photoAsset.update({
      where: { id: dto.photoId },
      data: {
        selectedFrameTemplateId: dto.frameTemplateId,
        processingStatus: PhotoProcessingStatus.QUEUED
      }
    });

    await this.prisma.photoSession.update({
      where: { id: asset.sessionId },
      data: {
        status: PhotoSessionStatus.PROCESSING
      }
    });

    const jobId = await this.queue.enqueuePhotoProcessJob({
      photoId: updatedAsset.id,
      sessionId: asset.sessionId,
      frameTemplateId: dto.frameTemplateId,
      requestedBy: user.id
    });

    return {
      photoId: updatedAsset.id,
      jobId,
      queue: PHOTO_PROCESS_JOB_NAME,
      status: "queued"
    };
  }

  async getOne(user: AuthenticatedRequestUser, photoId: string) {
    const asset = await this.findOwnedPhoto(photoId, user);

    return {
      ...serializePhotoAsset(asset, this.storage),
      session: serializePhotoSession(asset.session),
      downloadPageUrl: asset.publicShareToken ? `${this.env.webPublicUrl}/download/${asset.publicShareToken}` : null
    };
  }

  async getQr(user: AuthenticatedRequestUser, photoId: string) {
    const asset = await this.findOwnedPhoto(photoId, user);

    return {
      photoId: asset.id,
      downloadPageUrl: asset.publicShareToken ? `${this.env.webPublicUrl}/download/${asset.publicShareToken}` : null,
      qrCodeUrl: asset.qrCodeKey ? this.storage.getPublicUrl(asset.qrCodeKey) : null
    };
  }
}

@ApiTags("Photos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("photos")
class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload original photo asset" })
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUser() user: AuthenticatedRequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body("sessionId") sessionId: string
  ) {
    return this.photosService.upload(user, sessionId, file).then((data) => ok(data));
  }

  @Post(":id/source-bundle")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload selected source bundle for public downloads" })
  @UseInterceptors(FileInterceptor("file"))
  uploadSourceBundle(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.photosService.uploadSourceBundle(user, id, file).then((data) => ok(data));
  }

  @Post("process")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Queue asynchronous photo processing" })
  process(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: ProcessPhotoDto) {
    return this.photosService.process(user, dto).then((data) => ok(data));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get photo asset status and URLs" })
  getOne(@CurrentUser() user: AuthenticatedRequestUser, @Param("id") id: string) {
    return this.photosService.getOne(user, id).then((data) => ok(data));
  }

  @Get(":id/qr")
  @ApiOperation({ summary: "Get QR/download URLs" })
  getQr(@CurrentUser() user: AuthenticatedRequestUser, @Param("id") id: string) {
    return this.photosService.getQr(user, id).then((data) => ok(data));
  }
}

@Module({
  controllers: [PhotosController],
  providers: [PhotosService]
})
export class PhotosModule {}