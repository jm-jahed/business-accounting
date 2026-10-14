import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { Company, CompanyMembership, TenantContext } from '@accounting/database';

@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('Unauthenticated actor: user context missing.');
    }

    const rawCompanyId =
      request.headers['x-company-id'] ||
      request.params?.companyId ||
      request.query?.companyId;

    if (!rawCompanyId || typeof rawCompanyId !== 'string') {
      throw new BadRequestException('Company context required. Missing x-company-id header.');
    }

    if (!mongoose.Types.ObjectId.isValid(rawCompanyId)) {
      throw new BadRequestException('Invalid company ID format.');
    }

    const companyObjectId = new mongoose.Types.ObjectId(rawCompanyId);

    // Verify active membership
    const membership = await CompanyMembership.findOne({
      userId: user.sub,
      companyId: companyObjectId,
      status: 'active',
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: You are not an authorized member of this company.');
    }

    // Load company metadata for multi-industry / country pack awareness
    const company = await Company.findById(companyObjectId).lean();
    if (!company || company.status !== 'active') {
      throw new ForbiddenException('Access denied: Target company is not active.');
    }

    const tenantContext: TenantContext = {
      userId: user.sub,
      companyId: companyObjectId.toString(),
      role: membership.role,
      branchAccess: membership.branchAccess,
      branchId: (request.headers['x-branch-id'] as string) || null,
      countryCode: company.countryCode,
      industryType: company.industryType,
      enabledModules: company.enabledModules,
    };

    request.tenant = tenantContext;
    return true;
  }
}
