import { Injectable, OnModuleInit } from "@nestjs/common";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { EnvService } from "../config/env.js";

@Injectable()
export class LocalStorageService implements OnModuleInit {
  constructor(private readonly env: EnvService) {}

  async onModuleInit(): Promise<void> {
    await mkdir(this.env.storageRoot, { recursive: true });
  }

  resolvePath(key: string): string {
    return path.join(this.env.storageRoot, ...key.split("/"));
  }

  async putObject(key: string, buffer: Buffer): Promise<void> {
    const filePath = this.resolvePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
  }

  async readObject(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }

  async copyObject(sourceKey: string, targetKey: string): Promise<void> {
    const buffer = await this.readObject(sourceKey);
    await this.putObject(targetKey, buffer);
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.resolvePath(key), { force: true });
  }

  getPublicUrl(key: string): string {
    return `${this.env.apiPublicUrl}/assets/${key}`;
  }
}
