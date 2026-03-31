import { PrismaClient } from "@prisma/client";

declare global {
  var __photoboothPrisma: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: ["warn", "error"]
  });
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__photoboothPrisma) {
    globalThis.__photoboothPrisma = createPrismaClient();
  }

  return globalThis.__photoboothPrisma;
}