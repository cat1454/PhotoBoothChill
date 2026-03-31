import "reflect-metadata";
import "dotenv/config";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import express, { type NextFunction, type Request, type Response } from "express";

import { AppModule } from "./app.module.js";
import { EnvService } from "./config/env.js";

function isAllowedOrigin(origin: string | undefined, env: EnvService): boolean {
  if (!origin) {
    return true;
  }

  if (origin === env.webPublicUrl) {
    return true;
  }

  try {
    const expected = new URL(env.webPublicUrl);
    const requested = new URL(origin);

    return requested.protocol === expected.protocol && requested.port === expected.port;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      console.log(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`);
    });
    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, env)) {
        callback(null, true);
        return;
      }

      console.warn(`[api] Blocked CORS origin: ${origin ?? "unknown"}`);
      callback(new Error(`Blocked by CORS: ${origin ?? "unknown origin"}`), false);
    },
    credentials: false
  });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.use("/assets", express.static(env.storageRoot));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("PHOTobooth Native API")
    .setDescription("MVP API for web app, admin and photo worker orchestration")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument);

  await app.listen(env.apiPort);
  console.log(`API listening on ${env.apiPublicUrl}`);
}

bootstrap();
