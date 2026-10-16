import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AdminRole } from '@accounting/contracts';
import { loadAdminConfig, AdminConfig } from '../config/admin.config.js';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  tokenType: 'SUPER_ADMIN';
  sessionFamily?: string;
}

export interface AdminRefreshPayload {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  sessionFamily: string;
  tokenType: 'SUPER_ADMIN';
  jti?: string;
}

@Injectable()
export class AdminJwtService {
  private readonly config: AdminConfig;

  constructor() {
    this.config = loadAdminConfig();
  }

  public signAccessToken(payload: Omit<AdminJwtPayload, 'tokenType'>): string {
    const fullPayload: AdminJwtPayload = {
      ...payload,
      tokenType: 'SUPER_ADMIN',
    };
    return jwt.sign(fullPayload, this.config.accessSecret, {
      expiresIn: this.config.accessExpiry as any,
    });
  }

  public signRefreshToken(payload: Omit<AdminRefreshPayload, 'tokenType'>): string {
    const fullPayload: AdminRefreshPayload = {
      ...payload,
      tokenType: 'SUPER_ADMIN',
    };
    return jwt.sign(fullPayload, this.config.refreshSecret, {
      expiresIn: this.config.refreshExpiry as any,
    });
  }

  public signTempTotpToken(adminId: string, email: string): string {
    return jwt.sign(
      { sub: adminId, email, purpose: 'TOTP_VERIFICATION', tokenType: 'SUPER_ADMIN_TEMP' },
      this.config.accessSecret,
      { expiresIn: '5m' }
    );
  }

  public verifyTempTotpToken(token: string): { sub: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.config.accessSecret) as any;
      if (decoded.purpose !== 'TOTP_VERIFICATION' || decoded.tokenType !== 'SUPER_ADMIN_TEMP') {
        throw new UnauthorizedException('Invalid temporary verification token.');
      }
      return { sub: decoded.sub, email: decoded.email };
    } catch {
      throw new UnauthorizedException('Invalid or expired temporary verification token.');
    }
  }

  public verifyAccessToken(token: string): AdminJwtPayload {
    try {
      const decoded = jwt.verify(token, this.config.accessSecret) as AdminJwtPayload;
      if (decoded.tokenType !== 'SUPER_ADMIN') {
        throw new UnauthorizedException('Invalid token scope: Non-admin token presented to Super Admin API.');
      }
      return decoded;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid or expired Super Admin access token.');
    }
  }

  public verifyRefreshToken(token: string): AdminRefreshPayload {
    try {
      const decoded = jwt.verify(token, this.config.refreshSecret) as AdminRefreshPayload;
      if (decoded.tokenType !== 'SUPER_ADMIN') {
        throw new UnauthorizedException('Invalid refresh token scope.');
      }
      return decoded;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid or expired Super Admin refresh token.');
    }
  }

  public hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
