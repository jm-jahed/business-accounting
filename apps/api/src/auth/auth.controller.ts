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
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, ClientSessionMetadata } from './auth.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtUserPayload } from './jwt.service.js';
import {
  RegisterUserInput,
  LoginInput,
  RefreshTokenInput,
  GoogleAuthInput,
  GoogleLinkAccountInput,
} from '@accounting/contracts';

function setAuthCookies(
  res: Response,
  data: { accessToken: string; refreshToken: string; csrfToken: string }
) {
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Access token cookie (15 minutes)
  res.cookie('access_token', data.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  // 2. Refresh token cookie (7 days) - scoped to /api/auth so both /refresh and /logout receive it
  res.cookie('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 3. CSRF token cookie (accessible by JavaScript for double-submit header validation)
  res.cookie('csrf_token', data.csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';

  res.clearCookie('access_token', {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  });
  res.clearCookie('refresh_token', {
    path: '/api/auth',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  });
  res.clearCookie('csrf_token', {
    path: '/',
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
  });
}

function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  let rawIp = '';
  if (Array.isArray(forwarded)) {
    rawIp = forwarded[0] || '';
  } else if (typeof forwarded === 'string') {
    rawIp = forwarded.split(',')[0].trim();
  }
  if (!rawIp) {
    rawIp = req.socket?.remoteAddress || req.ip || '';
  }
  if (rawIp.startsWith('::ffff:')) {
    rawIp = rawIp.slice(7);
  }
  return rawIp.trim();
}

function extractMetadata(req: Request): ClientSessionMetadata {
  return {
    ipAddress: extractClientIp(req),
    userAgent: (req.headers['user-agent'] as string) || '',
  };
}

/**
 * Strips raw tokens from JSON payload when requested by browser web clients (x-client-type: web),
 * as browser authentication relies exclusively on HttpOnly cookies to mitigate XSS risks.
 */
function sanitizeResponseForClient(req: Request, result: any) {
  const isWebClient = req.headers['x-client-type'] === 'web';
  if (isWebClient && result && typeof result === 'object') {
    const { refreshToken: _omittedRefresh, accessToken: _omittedAccess, ...sanitized } = result;
    return sanitized;
  }
  return result;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: RegisterUserInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const metadata = extractMetadata(req);
    const result = await this.authService.register(body, metadata);
    setAuthCookies(res, result);
    return sanitizeResponseForClient(req, result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const metadata = extractMetadata(req);
    const result = await this.authService.login(body, metadata);
    setAuthCookies(res, result);
    return sanitizeResponseForClient(req, result);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() body: GoogleAuthInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const metadata = extractMetadata(req);
    const result = await this.authService.loginWithGoogle(body, metadata);
    setAuthCookies(res, result);
    return sanitizeResponseForClient(req, result);
  }

  @Post('google/link')
  @HttpCode(HttpStatus.OK)
  async googleLink(
    @Body() body: GoogleLinkAccountInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const metadata = extractMetadata(req);
    const result = await this.authService.linkGoogleAccount(body, metadata);
    setAuthCookies(res, result);
    return sanitizeResponseForClient(req, result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshTokenInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const rawRefreshToken = req.cookies?.refresh_token || body?.refreshToken;
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new BadRequestException('Refresh token is required via cookie or request body.');
    }

    const metadata = extractMetadata(req);
    const result = await this.authService.refresh(rawRefreshToken, metadata);
    setAuthCookies(res, result);
    return sanitizeResponseForClient(req, result);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtUserPayload | undefined,
    @Body() body: RefreshTokenInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const rawRefreshToken = req.cookies?.refresh_token || body?.refreshToken;

    await this.authService.logout({
      userId: user?.sub,
      sessionFamily: user?.sessionFamily,
      rawRefreshToken,
    });

    clearAuthCookies(res);
    return { success: true, message: 'Logged out successfully.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: JwtUserPayload) {
    return this.authService.getMe(user.sub);
  }
}
