import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JwtUserPayload {
  sub: string;
  email: string;
  fullName: string;
  sessionFamily?: string;
}

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  fullName: string;
  sessionFamily: string;
  jti?: string;
}

export class JwtConfigurationError extends Error {
  constructor(message: string) {
    super(`[JwtConfig] ${message}`);
    this.name = 'JwtConfigurationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validates JWT configuration based on runtime environment.
 * In production: strictly enforces non-empty, distinct secrets of at least 32 characters.
 */
export function validateJwtConfig(env: NodeJS.ProcessEnv = process.env): {
  accessSecret: string;
  refreshSecret: string;
  accessExpiry: string;
  refreshExpiry: string;
} {
  const isProduction = env.NODE_ENV === 'production';
  const accessSecret = env.JWT_ACCESS_SECRET?.trim() || '';
  const refreshSecret = env.JWT_REFRESH_SECRET?.trim() || '';
  const accessExpiry = env.JWT_ACCESS_EXPIRY?.trim() || '15m';
  const refreshExpiry = env.JWT_REFRESH_EXPIRY?.trim() || '7d';

  if (isProduction) {
    if (!accessSecret || accessSecret.length < 32) {
      throw new JwtConfigurationError(
        'Production security violation: JWT_ACCESS_SECRET is required and must be at least 32 characters long.'
      );
    }
    if (!refreshSecret || refreshSecret.length < 32) {
      throw new JwtConfigurationError(
        'Production security violation: JWT_REFRESH_SECRET is required and must be at least 32 characters long.'
      );
    }
    if (accessSecret === refreshSecret) {
      throw new JwtConfigurationError(
        'Production security violation: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct secrets.'
      );
    }
    return { accessSecret, refreshSecret, accessExpiry, refreshExpiry };
  }

  // Non-production (development / test) safe fallbacks with minimum length
  const safeAccessSecret =
    accessSecret.length >= 16
      ? accessSecret
      : 'dev-only-insecure-access-secret-minimum-32-chars!';
  const safeRefreshSecret =
    refreshSecret.length >= 16
      ? refreshSecret
      : 'dev-only-insecure-refresh-secret-minimum-32-chars!';

  return {
    accessSecret: safeAccessSecret,
    refreshSecret: safeRefreshSecret,
    accessExpiry,
    refreshExpiry,
  };
}

@Injectable()
export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;

  constructor() {
    const config = validateJwtConfig();
    this.accessSecret = config.accessSecret;
    this.refreshSecret = config.refreshSecret;
    this.accessExpiry = config.accessExpiry;
    this.refreshExpiry = config.refreshExpiry;
  }

  public signAccessToken(payload: JwtUserPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry as any,
    });
  }

  public signRefreshToken(payload: JwtRefreshPayload): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiry as any,
    });
  }

  public verifyAccessToken(token: string): JwtUserPayload {
    return jwt.verify(token, this.accessSecret) as JwtUserPayload;
  }

  public verifyRefreshToken(token: string): JwtRefreshPayload {
    return jwt.verify(token, this.refreshSecret) as JwtRefreshPayload;
  }

  /**
   * One-way SHA-256 cryptographic hash helper for storing refresh tokens securely.
   * Raw tokens are never stored in the database.
   */
  public hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Cryptographically secure CSRF token generator.
   */
  public generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
