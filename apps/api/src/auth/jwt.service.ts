import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

export interface JwtUserPayload {
  sub: string;
  email: string;
  fullName: string;
}

@Injectable()
export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'business-accounting-access-secret-fallback-key-2026';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'business-accounting-refresh-secret-fallback-key-2026';
    this.accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  public signAccessToken(payload: JwtUserPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry as any,
    });
  }

  public signRefreshToken(payload: JwtUserPayload): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiry as any,
    });
  }

  public verifyAccessToken(token: string): JwtUserPayload {
    return jwt.verify(token, this.accessSecret) as JwtUserPayload;
  }

  public verifyRefreshToken(token: string): JwtUserPayload {
    return jwt.verify(token, this.refreshSecret) as JwtUserPayload;
  }
}
