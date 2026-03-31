import { Body, Controller, Delete, Get, Injectable, Module, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

import { ok } from "../common/api.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { parseOptionalFrameTemplateType } from "../common/prisma-enums.js";
import { serializeFrameTemplate } from "../common/serializers.js";
import { PrismaService } from "../prisma/prisma.service.js";

class CreateFrameTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  locationId!: string;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateFrameTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Injectable()
class FrameTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locationId?: string, type?: string, isActive?: string) {
    const items = await this.prisma.frameTemplate.findMany({
      where: {
        locationId,
        type: parseOptionalFrameTemplateType(type),
        isActive: isActive === undefined ? undefined : isActive === "true"
      },
      orderBy: { createdAt: "asc" }
    });

    return items.map(serializeFrameTemplate);
  }

  async create(dto: CreateFrameTemplateDto) {
    const frame = await this.prisma.frameTemplate.create({
      data: {
        name: dto.name,
        locationId: dto.locationId,
        imageUrl: dto.imageUrl,
        type: parseOptionalFrameTemplateType(dto.type) ?? undefined,
        isActive: dto.isActive ?? true
      }
    });

    return serializeFrameTemplate(frame);
  }

  async update(id: string, dto: UpdateFrameTemplateDto) {
    const frame = await this.prisma.frameTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        locationId: dto.locationId,
        imageUrl: dto.imageUrl,
        type: parseOptionalFrameTemplateType(dto.type),
        isActive: dto.isActive
      }
    });

    return serializeFrameTemplate(frame);
  }

  async remove(id: string) {
    const frame = await this.prisma.frameTemplate.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return serializeFrameTemplate(frame);
  }
}

@ApiTags("Frame Templates")
@Controller("frame-templates")
class FrameTemplatesController {
  constructor(private readonly frameTemplatesService: FrameTemplatesService) {}

  @Get()
  @ApiOperation({ summary: "List frame templates" })
  list(
    @Query("locationId") locationId?: string,
    @Query("type") type?: string,
    @Query("isActive") isActive?: string
  ) {
    return this.frameTemplatesService.list(locationId, type, isActive).then((data) => ok(data));
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  create(@Body() dto: CreateFrameTemplateDto) {
    return this.frameTemplatesService.create(dto).then((data) => ok(data));
  }

  @Put(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  update(@Param("id") id: string, @Body() dto: UpdateFrameTemplateDto) {
    return this.frameTemplatesService.update(id, dto).then((data) => ok(data));
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  remove(@Param("id") id: string) {
    return this.frameTemplatesService.remove(id).then((data) => ok(data));
  }
}

@Module({
  controllers: [FrameTemplatesController],
  providers: [FrameTemplatesService]
})
export class FrameTemplatesModule {}
