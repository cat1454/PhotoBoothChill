import { Body, Controller, Delete, Get, Injectable, Module, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

import { slugify } from "@photobooth/shared";

import { ok } from "../common/api.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { parseOptionalLocationStatus } from "../common/prisma-enums.js";
import { serializeFrameTemplate, serializeLocation } from "../common/serializers.js";
import { PrismaService } from "../prisma/prisma.service.js";

class CreateLocationDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class UpdateLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

@Injectable()
class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: string, search?: string) {
    const items = await this.prisma.location.findMany({
      where: {
        status: parseOptionalLocationStatus(status),
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: { name: "asc" }
    });

    return items.map(serializeLocation);
  }

  async getOne(id: string) {
    const location = await this.prisma.location.findUniqueOrThrow({
      where: { id },
      include: {
        frameTemplates: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return {
      ...serializeLocation(location),
      frames: location.frameTemplates.map(serializeFrameTemplate)
    };
  }

  async create(dto: CreateLocationDto) {
    const location = await this.prisma.location.create({
      data: {
        name: dto.name,
        slug: slugify(dto.slug ?? dto.name),
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        status: parseOptionalLocationStatus(dto.status) ?? undefined
      }
    });

    return serializeLocation(location);
  }

  async update(id: string, dto: UpdateLocationDto) {
    const location = await this.prisma.location.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug ? slugify(dto.slug) : undefined,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        status: parseOptionalLocationStatus(dto.status)
      }
    });

    return serializeLocation(location);
  }

  async remove(id: string) {
    const location = await this.prisma.location.update({
      where: { id },
      data: {
        status: parseOptionalLocationStatus("inactive")
      }
    });

    return serializeLocation(location);
  }
}

@ApiTags("Locations")
@Controller("locations")
class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: "List locations" })
  list(@Query("status") status?: string, @Query("search") search?: string) {
    return this.locationsService.list(status, search).then((data) => ok(data));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get location details" })
  getOne(@Param("id") id: string) {
    return this.locationsService.getOne(id).then((data) => ok(data));
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto).then((data) => ok(data));
  }

  @Put(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  update(@Param("id") id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto).then((data) => ok(data));
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  remove(@Param("id") id: string) {
    return this.locationsService.remove(id).then((data) => ok(data));
  }
}

@Module({
  controllers: [LocationsController],
  providers: [LocationsService]
})
export class LocationsModule {}
