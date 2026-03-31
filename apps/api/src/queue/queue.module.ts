import { Global, Module } from "@nestjs/common";

import { ConfigModule } from "../config/config.module.js";
import { QueueService } from "./queue.service.js";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [QueueService],
  exports: [QueueService]
})
export class QueueModule {}