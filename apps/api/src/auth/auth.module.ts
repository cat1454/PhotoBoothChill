import { Body, ConflictException, Controller, Global, Injectable, Module, Post, UnauthorizedException } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { compare, hash } from "bcryptjs";
import { IsEmail, IsString, MinLength } from "class-validator";

import { ok } from "../common/api.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { serializeUser } from "../common/serializers.js";
import { ConfigModule } from "../config/config.module.js";
import { EnvService } from "../config/env.js";
import { PrismaService } from "../prisma/prisma.service.js";

class RegisterDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Injectable()
class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existing) {
      throw new ConflictException("Email is already registered.");
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        passwordHash: await hash(dto.password, 10)
      }
    });

    return this.issueToken(user.id, user.email, user.role, user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.issueToken(user.id, user.email, user.role, user);
  }

  private async issueToken(userId: string, email: string, role: string, user: { id: string; fullName: string; email: string; role: string }) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
      role
    });

    return {
      user: serializeUser(user),
      accessToken
    };
  }
}

@ApiTags("Auth")
@Controller("auth")
class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto).then((data) => ok(data));
  }

  @Post("login")
  @ApiOperation({ summary: "Login a user or admin" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto).then((data) => ok(data));
  }
}

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        global: true,
        secret: env.jwtSecret,
        signOptions: { expiresIn: "7d" }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard]
})
export class AuthModule {}
