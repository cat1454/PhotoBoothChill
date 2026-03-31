import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createPgBoss } from "@photobooth/db";
import { PHOTO_PROCESS_JOB_NAME, PhotoProcessJobPayload } from "@photobooth/shared";

import { EnvService } from "../config/env.js";

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private boss: ReturnType<typeof createPgBoss>;

  constructor(private readonly env: EnvService) {
    this.boss = createPgBoss(this.env.databaseUrl);
  }

  async onModuleInit(): Promise<void> {
    await this.boss.start();
    await this.boss.createQueue(PHOTO_PROCESS_JOB_NAME);
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop();
  }

  async enqueuePhotoProcessJob(payload: PhotoProcessJobPayload): Promise<string | null> {
    return this.boss.send(PHOTO_PROCESS_JOB_NAME, payload, {
      retryLimit: 3
    });
  }
}