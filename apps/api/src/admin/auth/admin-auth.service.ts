import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SuperAdminUser } from '@accounting/database';
import {
  AdminLoginInput,
  AdminTotpVerifyInput,
  AdminChangePasswordInput,
} from '@accounting/contracts';
import { AdminJwtService } from '../services/admin-jwt.service.js';
import { AdminTotpService } from '../services/admin-totp.service.js';
import { AdminAuditService } from '../services/admin-audit.service.js';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly jwtService: AdminJwtService,
    private readonly totpService: AdminTotpService,
    private readonly auditService: AdminAuditService
  ) {}

  public async login(input: AdminLoginInput, _meta?: { ip?: string; userAgent?: string }) {
    const email = input.email.trim().toLowerCase();
    const admin = await SuperAdminUser.findOne({ email });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (admin.status !== 'active') {
      throw new ForbiddenException('Admin account is suspended.');
    }

    // Check account lockout
    if (admin.lockoutUntil && admin.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((admin.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account locked due to 5 consecutive failed attempts. Please retry in ${waitMinutes} minutes.`
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, admin.passwordHash);
    if (!isPasswordValid) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
        await admin.save();
        throw new ForbiddenException(
          'Account locked due to 5 consecutive failed login attempts. Retry in 15 minutes.'
        );
      }
      await admin.save();
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Password is valid - reset failed attempts
    admin.failedLoginAttempts = 0;
    admin.lockoutUntil = null;
    await admin.save();

    const tempToken = this.jwtService.signTempTotpToken(admin._id.toString(), admin.email);

    return {
      tempToken,
      requiresTotp: admin.isTotpEnabled,
      requiresTotpSetup: !admin.isTotpEnabled,
      mustChangePassword: admin.mustChangePassword,
    };
  }

  public async setupTotp(tempToken: string) {
    const verified = this.jwtService.verifyTempTotpToken(tempToken);
    const admin = await SuperAdminUser.findById(verified.sub);
    if (!admin) throw new UnauthorizedException('Admin user not found.');

    const setup = this.totpService.generateTotpSetup(admin.email);

    // Save pending secret & recovery code hashes
    admin.encryptedTotpSecret = setup.encrypted.encrypted;
    admin.totpIv = setup.encrypted.iv;
    admin.totpAuthTag = setup.encrypted.authTag;
    admin.recoveryCodeHashes = setup.recoveryCodeHashes;
    await admin.save();

    return {
      secret: setup.secret,
      otpauthUri: setup.otpauthUri,
      recoveryCodes: setup.recoveryCodes,
      message: 'Store these recovery codes securely. They will not be shown again.',
    };
  }

  public async verifyTotp(input: AdminTotpVerifyInput, meta?: { ip?: string; userAgent?: string }) {
    const verified = this.jwtService.verifyTempTotpToken(input.tempToken);
    const admin = await SuperAdminUser.findById(verified.sub);
    if (!admin) throw new UnauthorizedException('Admin user not found.');

    if (!admin.encryptedTotpSecret || !admin.totpIv || !admin.totpAuthTag) {
      throw new BadRequestException('TOTP setup has not been initiated for this account.');
    }

    const code = input.totpCode.trim();
    let verifiedSuccessfully = false;

    // Check if user submitted a 6-digit TOTP token
    if (/^\d{6}$/.test(code)) {
      const totpResult = this.totpService.verifyTotpToken(
        code,
        {
          encrypted: admin.encryptedTotpSecret,
          iv: admin.totpIv,
          authTag: admin.totpAuthTag,
        },
        admin.lastUsedTimeStep || 0
      );

      if (totpResult.valid) {
        verifiedSuccessfully = true;
        admin.lastUsedTimeStep = totpResult.timeStep;
      }
    } else {
      // Check if user submitted a single-use recovery code
      const recoveryResult = this.totpService.verifyAndConsumeRecoveryCode(
        code,
        admin.recoveryCodeHashes || []
      );
      if (recoveryResult.valid) {
        verifiedSuccessfully = true;
        admin.recoveryCodeHashes = recoveryResult.remainingHashes;
      }
    }

    if (!verifiedSuccessfully) {
      throw new UnauthorizedException('Invalid or expired 2-step verification code / recovery code.');
    }

    // Mark TOTP activated
    admin.isTotpEnabled = true;
    admin.lastLoginAt = new Date();
    const sessionFamily = crypto.randomUUID();
    admin.sessionFamily = sessionFamily;

    // Generate tokens
    const accessToken = this.jwtService.signAccessToken({
      sub: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      sessionFamily,
    });

    const refreshToken = this.jwtService.signRefreshToken({
      sub: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      sessionFamily,
    });

    admin.refreshTokenHash = this.jwtService.hashToken(refreshToken);
    await admin.save();

    // Log to Audit Trail
    await this.auditService.logAction({
      actorId: admin._id.toString(),
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.auth.login_success',
      targetType: 'AdminUser',
      targetId: admin._id.toString(),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      afterState: { loginAt: admin.lastLoginAt.toISOString() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isTotpEnabled: admin.isTotpEnabled,
        mustChangePassword: admin.mustChangePassword,
      },
    };
  }

  public async changePassword(
    adminId: string,
    input: AdminChangePasswordInput,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const admin = await SuperAdminUser.findById(adminId);
    if (!admin) throw new UnauthorizedException('Admin user not found.');

    const isValidCurrent = await bcrypt.compare(input.currentPassword, admin.passwordHash);
    if (!isValidCurrent) {
      throw new BadRequestException('Current password does not match.');
    }

    if (input.newPassword.length < 12) {
      throw new BadRequestException('New password must be at least 12 characters long.');
    }

    const salt = await bcrypt.genSalt(12);
    admin.passwordHash = await bcrypt.hash(input.newPassword, salt);
    admin.mustChangePassword = false;
    await admin.save();

    await this.auditService.logAction({
      actorId: admin._id.toString(),
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.auth.change_password',
      targetType: 'AdminUser',
      targetId: admin._id.toString(),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { success: true, message: 'Password updated successfully.' };
  }

  public async refreshToken(rawRefreshToken: string) {
    const payload = this.jwtService.verifyRefreshToken(rawRefreshToken);
    const admin = await SuperAdminUser.findById(payload.sub);
    if (!admin || admin.status !== 'active') {
      throw new UnauthorizedException('Admin session is invalid or account suspended.');
    }

    const incomingHash = this.jwtService.hashToken(rawRefreshToken);
    if (admin.refreshTokenHash !== incomingHash || admin.sessionFamily !== payload.sessionFamily) {
      // Possible token reuse detected - revoke session family
      admin.sessionFamily = '';
      admin.refreshTokenHash = null;
      await admin.save();
      throw new UnauthorizedException('Refresh token reuse detected. Session revoked.');
    }

    // Rotate tokens
    const newSessionFamily = crypto.randomUUID();
    admin.sessionFamily = newSessionFamily;

    const newAccessToken = this.jwtService.signAccessToken({
      sub: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      sessionFamily: newSessionFamily,
    });

    const newRefreshToken = this.jwtService.signRefreshToken({
      sub: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      sessionFamily: newSessionFamily,
    });

    admin.refreshTokenHash = this.jwtService.hashToken(newRefreshToken);
    await admin.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public async logout(adminId: string, meta?: { ip?: string; userAgent?: string }) {
    const admin = await SuperAdminUser.findById(adminId);
    if (admin) {
      admin.sessionFamily = '';
      admin.refreshTokenHash = null;
      await admin.save();

      await this.auditService.logAction({
        actorId: admin._id.toString(),
        actorEmail: admin.email,
        adminRole: admin.role,
        action: 'admin.auth.logout',
        targetType: 'AdminUser',
        targetId: admin._id.toString(),
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });
    }
    return { success: true };
  }
}
