import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { loadAdminConfig } from '../config/admin.config.js';

@Injectable()
export class AdminCorsGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor() {
    const config = loadAdminConfig();
    this.allowedOrigins = config.corsOrigins;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = (request.headers['origin'] as string | undefined)?.trim();

    // If no browser origin header is present (curl, test runner, CLI), allow through
    if (!origin) {
      return true;
    }

    const isAllowed = this.allowedOrigins.some(
      (allowed) => allowed.toLowerCase() === origin.toLowerCase()
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        `CORS blocked: Origin "${origin}" is not permitted for the Super Admin panel.`
      );
    }

    return true;
  }
}
