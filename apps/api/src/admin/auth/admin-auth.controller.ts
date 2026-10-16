import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AdminLoginInputSchema,
  AdminTotpVerifyInputSchema,
  AdminChangePasswordSchema,
} from '@accounting/contracts';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminCorsGuard } from '../guards/admin-cors.guard.js';
import { AdminRateLimitGuard } from '../guards/admin-rate-limit.guard.js';
import { CurrentAdmin } from '../decorators/current-admin.decorator.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';
import { loadAdminConfig } from '../config/admin.config.js';

@Controller('admin/auth')
@UseGuards(AdminCorsGuard, AdminRateLimitGuard)
export class AdminAuthController {
  private readonly config = loadAdminConfig();

  constructor(private readonly authService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any, @Req() req: Request) {
    const validated = AdminLoginInputSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.login(validated, meta);
  }

  @Post('setup-totp')
  @HttpCode(HttpStatus.OK)
  async setupTotp(@Body('tempToken') tempToken: string) {
    return this.authService.setupTotp(tempToken);
  }

  @Post('verify-totp')
  @HttpCode(HttpStatus.OK)
  async verifyTotp(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const validated = AdminTotpVerifyInputSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.verifyTotp(validated, meta);

    // Set secure HttpOnly cookies
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(this.config.cookieAccessName, result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/api/admin',
    });

    res.cookie(this.config.cookieRefreshName, result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/admin/auth',
    });

    return result;
  }

  @Post('change-password')
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = AdminChangePasswordSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.changePassword(admin.sub, validated, meta);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const rawRefreshToken =
      req.cookies?.[this.config.cookieRefreshName] ||
      req.body?.refreshToken;

    const result = await this.authService.refreshToken(rawRefreshToken);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(this.config.cookieAccessName, result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/api/admin',
    });

    res.cookie(this.config.cookieRefreshName, result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/admin/auth',
    });

    return result;
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    res.clearCookie(this.config.cookieAccessName, { path: '/api/admin' });
    res.clearCookie(this.config.cookieRefreshName, { path: '/api/admin/auth' });

    return this.authService.logout(admin.sub, meta);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentAdmin() admin: AdminJwtPayload) {
    return {
      id: admin.sub,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      tokenType: admin.tokenType,
    };
  }
}
