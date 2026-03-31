import { Global, Module } from "@nestjs/common";

import { ConfigModule } from "../config/config.module.js";
import { LocalStorageService } from "./local-storage.service.js";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LocalStorageService],
  exports: [LocalStorageService]
})
export class StorageModule {}