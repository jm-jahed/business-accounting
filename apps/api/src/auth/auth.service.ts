import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, CompanyMembership, Company } from '@accounting/database';
import {
  RegisterUserInput,
  RegisterUserInputSchema,
  LoginInput,
  LoginInputSchema,
} from '@accounting/contracts';
import { JwtService, JwtUserPayload } from './jwt.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  public async register(rawInput: RegisterUserInput) {
    const input = RegisterUserInputSchema.parse(rawInput);

    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await User.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone || '',
      status: 'active',
      lastLoginAt: new Date(),
    });

    const payload: JwtUserPayload = {
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
    };
  }

  public async login(rawInput: LoginInput) {
    const input = LoginInputSchema.parse(rawInput);

    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new UnauthorizedException('Invalid email address or password.');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('This account has been suspended. Please contact support.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email address or password.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload: JwtUserPayload = {
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
    };
  }

  public async getMe(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid user ID.');
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    // Retrieve all active company memberships
    const memberships = await CompanyMembership.find({
      userId: userId,
      status: 'active',
    }).lean();

    const companyIds = memberships.map((m) => m.companyId);
    const companies = await Company.find({
      _id: { $in: companyIds },
      status: 'active',
    }).lean();

    const companyMap = new Map(companies.map((c) => [c._id.toString(), c]));

    const userCompanies = memberships
      .map((m) => {
        const company = companyMap.get(m.companyId.toString());
        if (!company) return null;
        return {
          companyId: company._id.toString(),
          name: company.name,
          legalName: company.legalName,
          currency: company.currency,
          countryCode: company.countryCode,
          industryType: company.industryType,
          enabledModules: company.enabledModules,
          role: m.role,
          branchAccess: m.branchAccess,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
      companies: userCompanies,
    };
  }
}
