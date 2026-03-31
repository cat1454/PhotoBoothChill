import "dotenv/config";

import { Injectable } from "@nestjs/common";

@Injectable()
export class EnvService {
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

  get jwtSecret(): string {
    return this.getValue("JWT_SECRET");
  }

  get apiPort(): number {
    return Number(this.getValue("API_PORT", "4000"));
  }

  get apiPublicUrl(): string {
    return this.getValue("API_PUBLIC_URL", `http://localhost:${this.apiPort}`);
  }

  get webPublicUrl(): string {
    return this.getValue("WEB_PUBLIC_URL", "http://localhost:3000");
  }

  get storageRoot(): string {
    return this.getValue("STORAGE_ROOT");
  }
}
