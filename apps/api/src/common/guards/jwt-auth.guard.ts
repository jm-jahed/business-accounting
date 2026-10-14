import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import crypto from 'crypto';
import { UserSession } from '@accounting/database';
import { JwtService, JwtUserPayload } from '../../auth/jwt.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const cookieAccessToken = request.cookies?.access_token;

    let token: string | null = null;
    let authType: 'bearer' | 'cookie' | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
      authType = 'bearer';
    } else if (cookieAccessToken && typeof cookieAccessToken === 'string') {
      token = cookieAccessToken.trim();
      authType = 'cookie';
    }

    if (!token) {
      throw new UnauthorizedException('Authentication required. Missing Bearer token or session cookie.');
    }

    let payload: JwtUserPayload;
    try {
      payload = this.jwtService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }

    // If token is associated with a session family, verify session is not revoked
    if (payload.sessionFamily) {
      const session = await UserSession.findOne({
        sessionFamily: payload.sessionFamily,
        userId: payload.sub,
      }).lean();

      if (session && session.isRevoked) {
        throw new UnauthorizedException('Session has been revoked. Please log in again.');
      }
    }

    // CSRF Protection: For cookie-authenticated state-changing requests, enforce CSRF token validation
    if (authType === 'cookie') {
      const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (stateChangingMethods.includes(request.method?.toUpperCase())) {
        const headerCsrfToken = (request.headers['x-csrf-token'] || request.headers['X-CSRF-Token']) as string | undefined;
        const cookieCsrfToken = request.cookies?.csrf_token as string | undefined;

        if (!headerCsrfToken || !cookieCsrfToken || typeof headerCsrfToken !== 'string' || typeof cookieCsrfToken !== 'string') {
          throw new ForbiddenException('Invalid or missing CSRF token.');
        }

        if (headerCsrfToken.length !== cookieCsrfToken.length) {
          throw new ForbiddenException('Invalid or missing CSRF token.');
        }

        const headerBuf = Buffer.from(headerCsrfToken);
        const cookieBuf = Buffer.from(cookieCsrfToken);
        if (!crypto.timingSafeEqual(headerBuf, cookieBuf)) {
          throw new ForbiddenException('Invalid or missing CSRF token.');
        }
      }
    }

    request.user = payload;
    request.authType = authType;
    return true;
  }
}
