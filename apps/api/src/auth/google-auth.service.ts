import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private client: OAuth2Client | null = null;
  private readonly clientId: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID?.trim() || '';
    if (this.clientId) {
      this.client = new OAuth2Client(this.clientId);
    }
  }

  /**
   * Helper to allow setting or mocking the OAuth2Client in unit tests.
   */
  public setOAuth2Client(client: OAuth2Client | null) {
    this.client = client;
  }

  public getClientId(): string {
    return this.clientId || process.env.GOOGLE_CLIENT_ID?.trim() || '';
  }

  /**
   * Cryptographically verifies the Google ID token and ensures all security assertions hold.
   */
  public async verifyIdToken(idToken: string): Promise<VerifiedGoogleUser> {
    if (!idToken || typeof idToken !== 'string') {
      throw new UnauthorizedException('Google ID token is required.');
    }

    const effectiveClientId = this.getClientId();
    if (!effectiveClientId) {
      this.logger.error('GOOGLE_CLIENT_ID is not configured on the server.');
      throw new UnauthorizedException('Google authentication is not configured on this server.');
    }

    if (!this.client) {
      this.client = new OAuth2Client(effectiveClientId);
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: effectiveClientId,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      this.logger.warn(`Google ID token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid or expired Google authentication token.');
    }

    if (!payload) {
      throw new UnauthorizedException('Malformed Google authentication token payload.');
    }

    // 1. Validate Issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      throw new UnauthorizedException('Untrusted Google token issuer.');
    }

    // 2. Validate Audience
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(effectiveClientId)) {
      throw new UnauthorizedException('Google token audience mismatch.');
    }

    // 3. Validate Expiration
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      throw new UnauthorizedException('Google token has expired.');
    }

    // 4. Validate Email & Verified Claim
    if (!payload.email) {
      throw new UnauthorizedException('Google account does not provide an email address.');
    }

    if (payload.email_verified !== true) {
      throw new UnauthorizedException('Google email address has not been verified by Google.');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Google token missing unique subject identifier.');
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      fullName: (payload.name || payload.email.split('@')[0] || 'Google User').trim(),
      avatarUrl: payload.picture || '',
    };
  }
}
