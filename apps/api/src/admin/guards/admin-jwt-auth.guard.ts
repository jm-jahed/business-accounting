import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminJwtService } from '../services/admin-jwt.service.js';
import { SuperAdminUser } from '@accounting/database';
import { loadAdminConfig } from '../config/admin.config.js';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(private readonly adminJwtService: AdminJwtService) {
    this.cookieName = loadAdminConfig().cookieAccessName;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extract token from Cookie or Bearer header
    let token = request.cookies?.[this.cookieName];
    if (!token) {
      const authHeader = request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException('Super Admin authentication required.');
    }

    // 2. Cryptographically verify token
    const payload = this.adminJwtService.verifyAccessToken(token);

    // 3. Verify user exists and is active in database
    const adminUser = await SuperAdminUser.findById(payload.sub).lean();
    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found.');
    }

    if (adminUser.status !== 'active') {
      throw new UnauthorizedException('Admin account is suspended.');
    }

    // 4. Attach adminUser context to request
    request.adminUser = {
      sub: adminUser._id.toString(),
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      tokenType: 'SUPER_ADMIN',
    };

    return true;
  }
}
