import { Module } from "@nestjs/common";

import { AdminModule } from "./admin/admin.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { ConfigModule } from "./config/config.module.js";
import { FrameTemplatesModule } from "./frame-templates/frame-templates.module.js";
import { LocationsModule } from "./locations/locations.module.js";
import { PassportModule } from "./passport/passport.module.js";
import { PhotoSessionsModule } from "./photo-sessions/photo-sessions.module.js";
import { PhotosModule } from "./photos/photos.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { QueueModule } from "./queue/queue.module.js";
import { StorageModule } from "./storage/storage.module.js";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    QueueModule,
    AuthModule,
    LocationsModule,
    FrameTemplatesModule,
    PhotoSessionsModule,
    PhotosModule,
    PassportModule,
    AdminModule
  ]
})
export class AppModule {}
