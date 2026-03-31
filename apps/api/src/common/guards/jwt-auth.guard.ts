import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../../prisma/prisma.service.js";
import { enumToApi } from "../api.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; email: string; role: string }>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user) {
        throw new UnauthorizedException("User no longer exists.");
      }

      request.user = {
        id: user.id,
        email: user.email,
        role: enumToApi(user.role)
      };

      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token.");
    }
  }
}
