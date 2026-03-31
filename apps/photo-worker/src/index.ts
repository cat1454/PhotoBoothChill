import "dotenv/config";

import { createPgBoss, createPrismaClient } from "@photobooth/db";
import { PHOTO_PROCESS_JOB_NAME, type PhotoProcessJobPayload } from "@photobooth/shared";

import { WorkerEnv } from "./config/env.js";
import { LocalStorage } from "./storage/local-storage.js";
import { handlePhotoProcessJob } from "./workers/photo-process.worker.js";

async function bootstrap() {
  const env = new WorkerEnv();
  const prisma = createPrismaClient();
  const boss = createPgBoss(env.databaseUrl);
  const storage = new LocalStorage(env.storageRoot);

  await storage.init();
  await prisma.$connect();
  await boss.start();
  await boss.createQueue(PHOTO_PROCESS_JOB_NAME);

  await boss.work(PHOTO_PROCESS_JOB_NAME, async (job: unknown) => {
    const nextJob = Array.isArray(job) ? job[0] : job;
    const payload = (nextJob as { data: PhotoProcessJobPayload }).data;
    await handlePhotoProcessJob(prisma, storage, env, payload);
  });

  console.log(`Photo worker listening for ${PHOTO_PROCESS_JOB_NAME}`);

  const shutdown = async () => {
    await boss.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});