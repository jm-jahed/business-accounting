import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { CompanyMemberRole } from '@accounting/database';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<CompanyMemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant || !tenant.role) {
      throw new ForbiddenException('Tenant authorization missing. Role could not be evaluated.');
    }

    // Owner always has omni-permission within tenant
    if (tenant.role === 'owner') {
      return true;
    }

    const hasRole = requiredRoles.includes(tenant.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient role privileges. Required: [${requiredRoles.join(', ')}], Current: ${tenant.role}`
      );
    }

    return true;
  }
}
