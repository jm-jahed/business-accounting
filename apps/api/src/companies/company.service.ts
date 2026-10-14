import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  Company,
  Branch,
  CompanyMembership,
  CompanyInvitation,
  User,
  TenantContext,
  assertEntityBelongsToTenant,
} from '@accounting/database';
import {
  CreateCompanyWithOnboardingInput,
  CreateCompanyWithOnboardingSchema,
  InviteUserInput,
  InviteUserInputSchema,
  AcceptInvitationInput,
  AcceptInvitationInputSchema,
  normalizeCompanySlug,
  RESERVED_COMPANY_SLUGS,
} from '@accounting/contracts';

@Injectable()
export class CompanyService {
  public async createCompany(
    userId: string,
    rawInput: CreateCompanyWithOnboardingInput
  ) {
    const input = CreateCompanyWithOnboardingSchema.parse(rawInput);

    // 1. Resolve and ensure unique store slug
    let baseSlug = input.slug || normalizeCompanySlug(input.name);
    if (!baseSlug || RESERVED_COMPANY_SLUGS.includes(baseSlug as any)) {
      baseSlug = `${baseSlug || 'store'}-${Date.now().toString().slice(-4)}`;
    }

    let finalSlug = baseSlug;
    let suffix = 1;
    while (await Company.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    // 2. Create company record
    const company = await Company.create({
      name: input.name,
      slug: finalSlug,
      legalName: input.legalName,
      taxId: input.taxId || '',
      trn: input.trn || '',
      currency: input.currency.toUpperCase(),
      fiscalYearStartMonth: input.fiscalYearStartMonth,
      countryCode: input.countryCode.toUpperCase(),
      industryType: input.industryType,
      enabledModules: input.enabledModules || ['accounting'],
      status: 'active',
    });

    // 3. Automatically provision default 'Main Branch'
    const mainBranch = await Branch.create({
      companyId: company._id,
      code: 'MAIN',
      name: 'Main Branch',
      isMain: true,
      status: 'active',
    });

    // 4. Grant creator 'owner' membership with global branch access
    const membership = await CompanyMembership.create({
      userId,
      companyId: company._id,
      role: 'owner',
      branchAccess: 'all',
      status: 'active',
    });

    return {
      company: {
        id: company._id.toString(),
        name: company.name,
        slug: company.slug,
        legalName: company.legalName,
        currency: company.currency,
        countryCode: company.countryCode,
        industryType: company.industryType,
        enabledModules: company.enabledModules,
        status: company.status,
      },
      mainBranch: {
        id: mainBranch._id.toString(),
        code: mainBranch.code,
        name: mainBranch.name,
      },
      membership: {
        role: membership.role,
        branchAccess: membership.branchAccess,
      },
    };
  }

  public async getUserCompanies(userId: string) {
    const memberships = await CompanyMembership.find({
      userId,
      status: 'active',
    }).lean();

    const companyIds = memberships.map((m) => m.companyId);
    const companies = await Company.find({
      _id: { $in: companyIds },
      status: 'active',
    }).lean();

    const companyMap = new Map(companies.map((c) => [c._id.toString(), c]));

    return memberships
      .map((m) => {
        const c = companyMap.get(m.companyId.toString());
        if (!c) return null;
        return {
          companyId: c._id.toString(),
          name: c.name,
          slug: c.slug,
          legalName: c.legalName,
          currency: c.currency,
          countryCode: c.countryCode,
          industryType: c.industryType,
          enabledModules: c.enabledModules,
          role: m.role,
          branchAccess: m.branchAccess,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  public async getCompanyDetails(companyId: string, tenant: TenantContext) {
    if (tenant.companyId !== companyId) {
      throw new BadRequestException('Requested company does not match active tenant boundary.');
    }

    const company = await Company.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const branches = await Branch.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean();

    for (const b of branches) {
      assertEntityBelongsToTenant(b, tenant.companyId, 'Branch');
    }

    const memberships = await CompanyMembership.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      status: 'active',
    }).lean();

    const userIds = memberships.map((m) => m.userId);
    const users = await User.find({
      _id: { $in: userIds },
    }).lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const members = memberships.map((m) => {
      const u = userMap.get(m.userId);
      return {
        userId: m.userId,
        fullName: u?.fullName || 'User',
        email: u?.email || '',
        role: m.role,
        branchAccess: m.branchAccess,
        status: m.status,
      };
    });

    return {
      company: {
        id: company._id.toString(),
        name: company.name,
        slug: company.slug,
        legalName: company.legalName,
        taxId: company.taxId,
        trn: company.trn,
        currency: company.currency,
        countryCode: company.countryCode,
        industryType: company.industryType,
        enabledModules: company.enabledModules,
        fiscalYearStartMonth: company.fiscalYearStartMonth,
        status: company.status,
      },
      branches: branches.map((b) => ({
        id: b._id.toString(),
        code: b.code,
        name: b.name,
        isMain: b.isMain,
        status: b.status,
      })),
      members,
    };
  }

  public async inviteUser(
    companyId: string,
    inviterId: string,
    rawInput: InviteUserInput
  ) {
    const input = InviteUserInputSchema.parse(rawInput);
    const compObjId = new mongoose.Types.ObjectId(companyId);

    // Verify inviter membership belongs to the target company
    const inviterMembership = await CompanyMembership.findOne({
      companyId: compObjId,
      userId: inviterId,
      status: 'active',
    }).lean();
    assertEntityBelongsToTenant(inviterMembership, companyId, 'Inviter membership');

    // Check if user already exists and is already member
    const existingUser = await User.findOne({ email: input.email }).lean();
    if (existingUser) {
      const existingMembership = await CompanyMembership.findOne({
        companyId: compObjId,
        userId: existingUser._id.toString(),
        status: 'active',
      }).lean();

      if (existingMembership) {
        throw new ConflictException('This user is already an active member of this company.');
      }
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = await CompanyInvitation.create({
      companyId: compObjId,
      email: input.email,
      role: input.role,
      token,
      invitedBy: inviterId,
      status: 'pending',
      expiresAt,
    });

    return {
      id: invitation._id.toString(),
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    };
  }

  public async listInvitations(companyId: string) {
    const invitations = await CompanyInvitation.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).lean();

    return invitations.map((inv) => ({
      id: inv._id.toString(),
      email: inv.email,
      role: inv.role,
      token: inv.token,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    }));
  }

  public async acceptInvitation(rawInput: AcceptInvitationInput) {
    const input = AcceptInvitationInputSchema.parse(rawInput);

    const invitation = await CompanyInvitation.findOne({
      token: input.token,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or has expired.');
    }

    // Verify target company existence and tenant integrity
    const targetCompany = await Company.findById(invitation.companyId).lean();
    assertEntityBelongsToTenant(
      targetCompany ? { companyId: targetCompany._id } : null,
      invitation.companyId.toString(),
      'Target company'
    );

    // Find or create user
    let user = await User.findOne({ email: invitation.email });
    if (!user) {
      const passwordHash = await bcrypt.hash(input.password, 10);
      user = await User.create({
        email: invitation.email,
        passwordHash,
        fullName: input.fullName,
        status: 'active',
        lastLoginAt: new Date(),
      });
    }

    // Provision or activate membership
    await CompanyMembership.findOneAndUpdate(
      {
        userId: user._id.toString(),
        companyId: invitation.companyId,
      },
      {
        role: invitation.role,
        branchAccess: 'all',
        status: 'active',
      },
      { upsert: true, new: true }
    );

    invitation.status = 'accepted';
    await invitation.save();

    return {
      success: true,
      companyId: invitation.companyId.toString(),
      email: user.email,
      role: invitation.role,
    };
  }
}
