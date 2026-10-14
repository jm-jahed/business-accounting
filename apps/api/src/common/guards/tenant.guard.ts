import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { Company, CompanyMembership, TenantContext } from '@accounting/database';
import { COMPANY_SLUG_REGEX, RESERVED_COMPANY_SLUGS } from '@accounting/contracts';

@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('Unauthenticated actor: user context missing.');
    }

    const rawStoreSlug =
      request.params?.storeSlug ||
      request.headers['x-store-slug'] ||
      request.query?.storeSlug;

    const rawCompanyId =
      request.headers['x-company-id'] ||
      request.params?.companyId ||
      request.query?.companyId;

    if (!rawStoreSlug && !rawCompanyId) {
      throw new BadRequestException('Company context required. Missing storeSlug route param or x-company-id header.');
    }

    let company: any = null;

    if (rawStoreSlug) {
      if (typeof rawStoreSlug !== 'string') {
        throw new BadRequestException('Invalid store slug type.');
      }

      const normalizedSlug = rawStoreSlug.trim().toLowerCase();

      if (
        !COMPANY_SLUG_REGEX.test(normalizedSlug) ||
        RESERVED_COMPANY_SLUGS.includes(normalizedSlug as any)
      ) {
        throw new BadRequestException('Invalid store slug format or reserved system keyword.');
      }

      company = await Company.findOne({ slug: normalizedSlug }).lean();
      if (!company) {
        throw new NotFoundException(`Store "${normalizedSlug}" not found.`);
      }

      // If rawCompanyId was also passed, ensure it does not conflict
      if (rawCompanyId && mongoose.Types.ObjectId.isValid(rawCompanyId)) {
        if (company._id.toString() !== rawCompanyId.toString()) {
          throw new ForbiddenException('Cross-tenant access violation: Store slug and company ID mismatch.');
        }
      }
    } else {
      if (typeof rawCompanyId !== 'string' || !mongoose.Types.ObjectId.isValid(rawCompanyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }

      company = await Company.findById(new mongoose.Types.ObjectId(rawCompanyId)).lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
    }

    if (company.status !== 'active') {
      throw new ForbiddenException('Access denied: Target company is not active.');
    }

    // Strict membership verification: verify actor has active membership in the target company
    const membership = await CompanyMembership.findOne({
      userId: user.sub,
      companyId: company._id,
      status: 'active',
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: You are not an authorized member of this store.');
    }

    const tenantContext: TenantContext = {
      userId: user.sub,
      companyId: company._id.toString(),
      companySlug: company.slug,
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
