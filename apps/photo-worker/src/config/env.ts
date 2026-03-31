import "dotenv/config";

export class WorkerEnv {
  private getValue(key: string, fallback?: string): string {
    const value = process.env[key] ?? fallback;
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
  }

  get databaseUrl(): string {
    return this.getValue("DATABASE_URL");
  }

  get storageRoot(): string {
    return this.getValue("STORAGE_ROOT");
  }

  get webPublicUrl(): string {
    return this.getValue("WEB_PUBLIC_URL", "http://localhost:3000");
  }
}