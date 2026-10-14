import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, CompanyMembership, Company, UserSession } from '@accounting/database';
import {
  RegisterUserInput,
  RegisterUserInputSchema,
  LoginInput,
  LoginInputSchema,
} from '@accounting/contracts';
import { JwtService, JwtUserPayload, JwtRefreshPayload } from './jwt.service.js';

export interface ClientSessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface ActiveSessionRotation {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  sessionFamily: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    status: string;
  };
  expiresAt: number;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  public static readonly DEFAULT_MAX_CACHE_SIZE = 5000;
  private maxCacheSize = AuthService.DEFAULT_MAX_CACHE_SIZE;
  private cleanupTimer: NodeJS.Timeout | null = null;

  // 1. In-flight promise coalescing: deduplicates concurrent requests presenting the exact same refresh token
  private readonly inFlightRefreshes = new Map<string, Promise<any>>();

  // 2. Short-lived in-memory cache of the active rotated token pair per sessionFamily (30s grace window)
  // Ensures race conditions/retries return the IDENTICAL active token pair without conflicting token churn
  private readonly recentRotations = new Map<string, ActiveSessionRotation>();

  constructor(private readonly jwtService: JwtService) {
    this.cleanupTimer = setInterval(() => {
      this.pruneExpiredRotations();
    }, 60000);
    if (this.cleanupTimer?.unref) {
      this.cleanupTimer.unref();
    }
  }

  public onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.recentRotations.clear();
    this.inFlightRefreshes.clear();
  }

  public pruneExpiredRotations(now: number = Date.now()): number {
    let pruned = 0;
    for (const [key, entry] of this.recentRotations.entries()) {
      if (entry.expiresAt <= now) {
        this.recentRotations.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  public setMaxCacheSizeForTesting(size: number): void {
    this.maxCacheSize = size;
  }

  public getCacheSizeForTesting(): number {
    return this.recentRotations.size;
  }

  public getCachedEntryForTesting(sessionFamily: string): ActiveSessionRotation | undefined {
    return this.recentRotations.get(sessionFamily);
  }

  private setRecentRotation(sessionFamily: string, rotation: ActiveSessionRotation): void {
    if (this.recentRotations.size >= this.maxCacheSize) {
      this.pruneExpiredRotations();
    }

    while (this.recentRotations.size >= this.maxCacheSize) {
      const oldestKey = this.recentRotations.keys().next().value;
      if (!oldestKey) break;
      this.recentRotations.delete(oldestKey);
    }

    this.recentRotations.set(sessionFamily, rotation);
  }

  public async register(rawInput: RegisterUserInput, metadata?: ClientSessionMetadata) {
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

    const sessionFamily = crypto.randomUUID();

    const payload: JwtUserPayload = {
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      sessionFamily,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      sessionFamily,
    };

    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(refreshPayload);

    // Persist session with cryptographic hash of refresh token
    const refreshTokenHash = this.jwtService.hashToken(refreshToken);
    await UserSession.create({
      userId: user._id,
      sessionFamily,
      refreshTokenHash,
      ipAddress: metadata?.ipAddress || '',
      userAgent: metadata?.userAgent || '',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const csrfToken = this.jwtService.generateCsrfToken();

    return {
      accessToken,
      refreshToken,
      csrfToken,
      sessionFamily,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
    };
  }

  public async login(rawInput: LoginInput, metadata?: ClientSessionMetadata) {
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

    const sessionFamily = crypto.randomUUID();

    const payload: JwtUserPayload = {
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      sessionFamily,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      sessionFamily,
    };

    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(refreshPayload);

    // Persist session with cryptographic hash of refresh token
    const refreshTokenHash = this.jwtService.hashToken(refreshToken);
    await UserSession.create({
      userId: user._id,
      sessionFamily,
      refreshTokenHash,
      ipAddress: metadata?.ipAddress || '',
      userAgent: metadata?.userAgent || '',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const csrfToken = this.jwtService.generateCsrfToken();

    return {
      accessToken,
      refreshToken,
      csrfToken,
      sessionFamily,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
    };
  }

  public async refresh(rawRefreshToken: string, metadata?: ClientSessionMetadata) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const incomingHash = this.jwtService.hashToken(rawRefreshToken);

    // Concurrency Optimization: If the exact same token is currently refreshing in-flight,
    // coalesce requests to receive the exact same promise result.
    if (this.inFlightRefreshes.has(incomingHash)) {
      return this.inFlightRefreshes.get(incomingHash)!;
    }

    const refreshOp = this.executeRefresh(rawRefreshToken, incomingHash, metadata);
    this.inFlightRefreshes.set(incomingHash, refreshOp);

    try {
      return await refreshOp;
    } finally {
      this.inFlightRefreshes.delete(incomingHash);
    }
  }

  private async executeRefresh(
    rawRefreshToken: string,
    incomingHash: string,
    metadata?: ClientSessionMetadata
  ) {
    let payload: JwtRefreshPayload;
    try {
      payload = this.jwtService.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Check in-memory 30-second grace window cache:
    // If this session family was just rotated and incoming token matches the rotated predecessor,
    // return the IDENTICAL active token pair idempotently without conflicting token churn.
    const cached = this.recentRotations.get(payload.sessionFamily);
    if (cached) {
      if (Date.now() >= cached.expiresAt) {
        this.recentRotations.delete(payload.sessionFamily);
      } else {
        const activeSession = await UserSession.findOne({
          sessionFamily: payload.sessionFamily,
          userId: payload.sub,
        }).lean();

        if (activeSession && !activeSession.isRevoked && activeSession.previousTokenHash === incomingHash) {
          // Re-verify current user status before returning cached token pair
          const user = await User.findById(payload.sub).select('status').lean();
          if (!user || user.status !== 'active') {
            this.recentRotations.delete(payload.sessionFamily);
            await UserSession.updateMany(
              { sessionFamily: payload.sessionFamily },
              { isRevoked: true, revokedAt: new Date(), revokedReason: 'User account suspended or not found' }
            );
            throw new UnauthorizedException('User account is no longer active.');
          }

          return {
            accessToken: cached.accessToken,
            refreshToken: cached.refreshToken,
            csrfToken: cached.csrfToken,
            sessionFamily: cached.sessionFamily,
            user: cached.user,
          };
        }
      }
    }

    const session = await UserSession.findOne({
      sessionFamily: payload.sessionFamily,
      userId: payload.sub,
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or already terminated.');
    }

    if (session.isRevoked) {
      this.recentRotations.delete(payload.sessionFamily);
      await UserSession.updateMany(
        { sessionFamily: payload.sessionFamily },
        { isRevoked: true, revokedAt: new Date(), revokedReason: 'Attempted use of revoked session' }
      );
      throw new UnauthorizedException('Session has been revoked. Please log in again.');
    }

    // Refresh Token Reuse Detection & Concurrency Grace Window:
    if (session.refreshTokenHash !== incomingHash) {
      const isRecentRotationRace =
        session.previousTokenHash &&
        session.previousTokenHash === incomingHash &&
        session.rotatedAt &&
        Date.now() - session.rotatedAt.getTime() < 30000;

      if (!isRecentRotationRace) {
        // Genuine Token Reuse Detected: Immediately revoke the entire session family
        this.recentRotations.delete(payload.sessionFamily);
        session.isRevoked = true;
        session.revokedAt = new Date();
        session.revokedReason = 'Token reuse detected';
        await session.save();

        await UserSession.updateMany(
          { sessionFamily: payload.sessionFamily },
          { isRevoked: true, revokedAt: new Date(), revokedReason: 'Token reuse detected' }
        );

        throw new UnauthorizedException('Security alert: Refresh token reuse detected. Session has been terminated.');
      }
    }

    // Expiration check
    if (session.expiresAt.getTime() < Date.now()) {
      this.recentRotations.delete(payload.sessionFamily);
      session.isRevoked = true;
      session.revokedAt = new Date();
      session.revokedReason = 'Session expired';
      await session.save();
      throw new UnauthorizedException('Session has expired. Please log in again.');
    }

    // Verify user is still active in database
    const user = await User.findById(payload.sub).lean();
    if (!user || user.status !== 'active') {
      this.recentRotations.delete(payload.sessionFamily);
      session.isRevoked = true;
      session.revokedAt = new Date();
      session.revokedReason = 'User account suspended or not found';
      await session.save();
      throw new UnauthorizedException('User account is no longer active.');
    }

    // Generate new active token pair
    const newAccessToken = this.jwtService.signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      sessionFamily: payload.sessionFamily,
    });

    const newRefreshToken = this.jwtService.signRefreshToken({
      sub: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      sessionFamily: payload.sessionFamily,
    });

    const newRefreshTokenHash = this.jwtService.hashToken(newRefreshToken);

    // ATOMIC CONDITIONAL UPDATE:
    // Ensures only one operation updates refreshTokenHash matching incomingHash.
    const updatedSession = await UserSession.findOneAndUpdate(
      {
        _id: session._id,
        refreshTokenHash: incomingHash,
        isRevoked: false,
      },
      {
        $set: {
          previousTokenHash: incomingHash,
          refreshTokenHash: newRefreshTokenHash,
          rotatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: metadata?.ipAddress || session.ipAddress,
          userAgent: metadata?.userAgent || session.userAgent,
        },
      },
      { new: true }
    );

    if (!updatedSession) {
      // Race collision at database level: check if another concurrent worker won and cached result
      const activeCached = this.recentRotations.get(payload.sessionFamily);
      if (activeCached) {
        if (Date.now() >= activeCached.expiresAt) {
          this.recentRotations.delete(payload.sessionFamily);
        } else {
          const user = await User.findById(payload.sub).select('status').lean();
          if (!user || user.status !== 'active') {
            this.recentRotations.delete(payload.sessionFamily);
            await UserSession.updateMany(
              { sessionFamily: payload.sessionFamily },
              { isRevoked: true, revokedAt: new Date(), revokedReason: 'User account suspended or not found' }
            );
            throw new UnauthorizedException('User account is no longer active.');
          }
          return activeCached;
        }
      }

      const refreshedSession = await UserSession.findOne({
        _id: session._id,
        isRevoked: false,
      }).lean();

      if (
        refreshedSession &&
        refreshedSession.previousTokenHash === incomingHash &&
        refreshedSession.rotatedAt &&
        Date.now() - refreshedSession.rotatedAt.getTime() < 30000
      ) {
        throw new UnauthorizedException('Concurrent session refresh in progress. Please use the newly issued token.');
      }

      throw new UnauthorizedException('Concurrent session refresh collision. Please retry.');
    }

    const csrfToken = this.jwtService.generateCsrfToken();

    const result = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      csrfToken,
      sessionFamily: payload.sessionFamily,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
      },
    };

    // Cache the active rotated pair for 30s to serve concurrent retry/in-flight requests idempotently
    this.setRecentRotation(payload.sessionFamily, {
      ...result,
      expiresAt: Date.now() + 30000,
    });

    return result;
  }

  public async logout(options: {
    userId?: string;
    sessionFamily?: string;
    rawRefreshToken?: string;
  }) {
    const { userId, sessionFamily, rawRefreshToken } = options;

    if (sessionFamily) {
      this.recentRotations.delete(sessionFamily);
    }

    if (rawRefreshToken) {
      try {
        const payload = this.jwtService.verifyRefreshToken(rawRefreshToken);
        if (payload?.sessionFamily) {
          this.recentRotations.delete(payload.sessionFamily);
        }
      } catch {}
    }

    if (sessionFamily && userId) {
      await UserSession.updateMany(
        { sessionFamily, userId },
        {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'User logged out',
        }
      );
    } else if (rawRefreshToken) {
      try {
        const payload = this.jwtService.verifyRefreshToken(rawRefreshToken);
        await UserSession.updateMany(
          { sessionFamily: payload.sessionFamily },
          {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'User logged out',
          }
        );
      } catch {
        const hash = this.jwtService.hashToken(rawRefreshToken);
        await UserSession.updateMany(
          { refreshTokenHash: hash },
          {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'User logged out',
          }
        );
      }
    } else if (userId) {
      // Fallback: revoke all sessions for this user if no specific sessionFamily given
      await UserSession.updateMany(
        { userId, isRevoked: false },
        {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'User logged out (all sessions)',
        }
      );
    }

    return { success: true, message: 'Logged out successfully.' };
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
          slug: company.slug,
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
