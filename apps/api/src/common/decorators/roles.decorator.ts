import { SetMetadata } from '@nestjs/common';
import { CompanyMemberRole } from '@accounting/database';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: CompanyMemberRole[]) => SetMetadata(ROLES_KEY, roles);
