import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class AdminRateLimitGuard implements CanActivate {
  private static readonly tracker = new Map<string, RateLimitRecord>();

  // Configurable thresholds
  public static AUTH_LIMIT = 10; // max 10 attempts per minute on auth routes
  public static GENERAL_LIMIT = 100; // max 100 attempts per minute on other admin routes
  public static WINDOW_MS = 60_000; // 1 minute window

  public static reset(): void {
    AdminRateLimitGuard.tracker.clear();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.socket?.remoteAddress || '127.0.0.1';
    const path = request.path || request.url || '';

    const isAuthRoute =
      path.includes('/admin/auth/login') ||
      path.includes('/admin/auth/verify-totp') ||
      path.includes('/admin/auth/setup-totp');

    const limit = isAuthRoute ? AdminRateLimitGuard.AUTH_LIMIT : AdminRateLimitGuard.GENERAL_LIMIT;
    const key = `${ip}:${isAuthRoute ? 'auth' : 'general'}`;
    const now = Date.now();

    const record = AdminRateLimitGuard.tracker.get(key);

    if (!record || record.resetAt <= now) {
      AdminRateLimitGuard.tracker.set(key, {
        count: 1,
        resetAt: now + AdminRateLimitGuard.WINDOW_MS,
      });
      return true;
    }

    if (record.count >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests to admin panel. Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count += 1;
    return true;
  }
}
