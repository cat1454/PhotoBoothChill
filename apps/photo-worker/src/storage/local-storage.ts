import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export class LocalStorage {
  constructor(private readonly storageRoot: string) {}

  async init(): Promise<void> {
    await mkdir(this.storageRoot, { recursive: true });
  }

  private resolvePath(key: string): string {
    return path.join(this.storageRoot, ...key.split("/"));
  }

  async putObject(key: string, buffer: Buffer): Promise<void> {
    const filePath = this.resolvePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
  }

  async readObject(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }
}