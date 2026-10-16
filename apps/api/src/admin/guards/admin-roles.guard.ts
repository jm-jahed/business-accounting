import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator.js';
import { AdminRole } from '@accounting/contracts';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const adminUser = request.adminUser;

    if (!adminUser || !adminUser.role) {
      throw new ForbiddenException('Admin role authorization missing.');
    }

    // SUPER_ADMIN has omni-permission within the admin plane
    if (adminUser.role === 'SUPER_ADMIN') {
      return true;
    }

    const hasRole = requiredRoles.includes(adminUser.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient admin privileges. Required: [${requiredRoles.join(', ')}], Current: ${adminUser.role}`
      );
    }

    return true;
  }
}
