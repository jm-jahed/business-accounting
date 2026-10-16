import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { Company, CompanyMembership, Subscription, TenantContext } from '@accounting/database';
import { COMPANY_SLUG_REGEX, RESERVED_COMPANY_SLUGS } from '@accounting/contracts';

interface CachedSubscription {
  status: string;
  expiresAt: number;
}

@Injectable()
export class TenantGuard implements CanActivate {
  private static readonly subscriptionCache = new Map<string, CachedSubscription>();
  private static readonly SUBSCRIPTION_CACHE_TTL_MS = 45_000; // 45 seconds

  public static invalidateSubscriptionCache(companyId: string): void {
    TenantGuard.subscriptionCache.delete(companyId);
  }

  public static clearSubscriptionCache(): void {
    TenantGuard.subscriptionCache.clear();
  }

  public static getCachedSubscription(companyId: string): CachedSubscription | undefined {
    return TenantGuard.subscriptionCache.get(companyId);
  }

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

    // Subscription Enforcement Policy (Single Source of Truth)
    // Cached lookup (45 seconds TTL) to prevent repeated DB hits
    const companyIdStr = company._id.toString();
    const now = Date.now();
    let subStatus: string;
    const cached = TenantGuard.subscriptionCache.get(companyIdStr);

    if (cached && cached.expiresAt > now) {
      subStatus = cached.status;
    } else {
      const subscription = await Subscription.findOne({ companyId: company._id }).lean();
      subStatus = subscription?.status || 'ACTIVE';
      TenantGuard.subscriptionCache.set(companyIdStr, {
        status: subStatus,
        expiresAt: now + TenantGuard.SUBSCRIPTION_CACHE_TTL_MS,
      });
    }

    if (subStatus === 'SUSPENDED') {
      throw new ForbiddenException(
        'Company account is suspended. Please contact platform support / কোম্পানির অ্যাকাউন্টটি স্থগিত করা হয়েছে। অনুগ্রহ করে সাপোর্ট টিমের সাথে যোগাযোগ করুন।'
      );
    }

    if (subStatus === 'READ_ONLY') {
      const method = (request.method || 'GET').toUpperCase();
      const isReadOnlySafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
      if (!isReadOnlySafe) {
        throw new ForbiddenException(
          'Subscription is in read-only mode due to billing status. Modifications are disabled / বিলিং স্ট্যাটাসের কারণে অ্যাকাউন্টটি রিড-অনলি মোডে রয়েছে। কোনো তথ্য পরিবর্তন বা নতুন ভাউচার লেখা যাবে না।'
        );
      }
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
