import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import {
  dbManager,
  User,
  UserSession,
  assertTestDatabase,
} from '@accounting/database';
import { JwtService } from '../auth/jwt.service.js';
import { AuthService } from '../auth/auth.service.js';
import { AuthController } from '../auth/auth.controller.js';
import { GoogleAuthService, VerifiedGoogleUser } from '../auth/google-auth.service.js';

class MockGoogleAuthService extends GoogleAuthService {
  private mockResult: VerifiedGoogleUser | null = null;
  private mockError: Error | null = null;

  public setMockResult(result: VerifiedGoogleUser | null) {
    this.mockResult = result;
    this.mockError = null;
  }

  public setMockError(error: Error | null) {
    this.mockError = error;
    this.mockResult = null;
  }

  public override async verifyIdToken(idToken: string): Promise<VerifiedGoogleUser> {
    if (this.mockError) {
      throw this.mockError;
    }
    if (this.mockResult) {
      return this.mockResult;
    }
    return super.verifyIdToken(idToken);
  }
}

describe('Google Authentication & Secure Account Linking Suite', () => {
  const jwtService = new JwtService();
  const mockGoogleService = new MockGoogleAuthService();
  const authService = new AuthService(jwtService, mockGoogleService);
  const authController = new AuthController(authService);

  const newGoogleEmail = `google_new_${Date.now()}@google-test.ae`;
  const existingPasswordEmail = `google_link_${Date.now()}@google-test.ae`;
  const suspendedGoogleEmail = `google_suspended_${Date.now()}@google-test.ae`;
  const existingPasswordPlain = 'SecurePass123!';

  let newGoogleUserId = '';
  let existingPasswordUserId = '';
  let suspendedGoogleUserId = '';
  const googleSubNew = `sub_${Date.now()}_1`;
  const googleSubExisting = `sub_${Date.now()}_2`;
  const googleSubSuspended = `sub_${Date.now()}_3`;

  before(async () => {
    if (process.env.MONGODB_URI) {
      const dbName = process.env.DB_NAME || 'business_accounting_test';
      try {
        assertTestDatabase(dbName);
        await dbManager.connect();
      } catch {
        // Disconnected test mode fallback
        return;
      }

      if (mongoose.connection.readyState === 1) {
        // Seed an existing local account with password
        const passwordHash = await bcrypt.hash(existingPasswordPlain, 10);
        const existingUser = await User.create({
          email: existingPasswordEmail,
          passwordHash,
          fullName: 'Existing Local User',
          status: 'active',
          authProvider: 'local',
        });
        existingPasswordUserId = existingUser._id.toString();

        // Seed a suspended user
        const suspendedUser = await User.create({
          email: suspendedGoogleEmail,
          passwordHash: '',
          fullName: 'Suspended Google User',
          googleId: googleSubSuspended,
          status: 'suspended',
          authProvider: 'google',
        });
        suspendedGoogleUserId = suspendedUser._id.toString();
      }
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      if (newGoogleUserId) await User.deleteOne({ _id: newGoogleUserId });
      if (existingPasswordUserId) await User.deleteOne({ _id: existingPasswordUserId });
      if (suspendedGoogleUserId) await User.deleteOne({ _id: suspendedGoogleUserId });
      await UserSession.deleteMany({
        userId: { $in: [newGoogleUserId, existingPasswordUserId, suspendedGoogleUserId] },
      });
    }
  });

  describe('GoogleAuthService Token Validation Assertions', () => {
    it('should reject missing, empty, or whitespace ID tokens', async () => {
      const realService = new GoogleAuthService();
      await assert.rejects(
        async () => realService.verifyIdToken(''),
        (err: any) => err instanceof UnauthorizedException && /required/.test(err.message)
      );
    });

    it('should reject when GOOGLE_CLIENT_ID is not configured on server', async () => {
      const originalEnv = process.env.GOOGLE_CLIENT_ID;
      try {
        delete process.env.GOOGLE_CLIENT_ID;
        const unconfiguredService = new GoogleAuthService();
        await assert.rejects(
          async () => unconfiguredService.verifyIdToken('some-mock-token'),
          (err: any) => err instanceof UnauthorizedException && /not configured/.test(err.message)
        );
      } finally {
        process.env.GOOGLE_CLIENT_ID = originalEnv;
      }
    });

    it('should reject invalid or untrusted token signatures', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const realService = new GoogleAuthService();
      await assert.rejects(
        async () => realService.verifyIdToken('invalid.jwt.token'),
        (err: any) => err instanceof UnauthorizedException && /Invalid or expired/.test(err.message)
      );
    });

    it('should reject token with unverified email (email_verified: false)', async () => {
      const mockOAuth2Client = {
        verifyIdToken: async () => ({
          getPayload: () => ({
            iss: 'https://accounts.google.com',
            aud: 'test-client-id.apps.googleusercontent.com',
            sub: '1234567890',
            email: 'unverified@example.com',
            email_verified: false,
            exp: Math.floor(Date.now() / 1000) + 3600,
            name: 'Unverified User',
          }),
        }),
      } as any;

      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const service = new GoogleAuthService();
      service.setOAuth2Client(mockOAuth2Client);

      await assert.rejects(
        async () => service.verifyIdToken('token-with-unverified-email'),
        (err: any) => err instanceof UnauthorizedException && /not been verified/.test(err.message)
      );
    });

    it('should reject token with untrusted issuer', async () => {
      const mockOAuth2Client = {
        verifyIdToken: async () => ({
          getPayload: () => ({
            iss: 'https://malicious-issuer.com',
            aud: 'test-client-id.apps.googleusercontent.com',
            sub: '1234567890',
            email: 'test@example.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        }),
      } as any;

      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const service = new GoogleAuthService();
      service.setOAuth2Client(mockOAuth2Client);

      await assert.rejects(
        async () => service.verifyIdToken('token-with-bad-issuer'),
        (err: any) => err instanceof UnauthorizedException && /Untrusted Google token issuer/.test(err.message)
      );
    });

    it('should reject token with audience mismatch', async () => {
      const mockOAuth2Client = {
        verifyIdToken: async () => ({
          getPayload: () => ({
            iss: 'https://accounts.google.com',
            aud: 'different-app-client-id.apps.googleusercontent.com',
            sub: '1234567890',
            email: 'test@example.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        }),
      } as any;

      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const service = new GoogleAuthService();
      service.setOAuth2Client(mockOAuth2Client);

      await assert.rejects(
        async () => service.verifyIdToken('token-with-wrong-audience'),
        (err: any) => err instanceof UnauthorizedException && /audience mismatch/.test(err.message)
      );
    });

    it('should reject expired Google tokens', async () => {
      const mockOAuth2Client = {
        verifyIdToken: async () => ({
          getPayload: () => ({
            iss: 'https://accounts.google.com',
            aud: 'test-client-id.apps.googleusercontent.com',
            sub: '1234567890',
            email: 'test@example.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) - 60, // Expired 1 min ago
          }),
        }),
      } as any;

      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const service = new GoogleAuthService();
      service.setOAuth2Client(mockOAuth2Client);

      await assert.rejects(
        async () => service.verifyIdToken('expired-token'),
        (err: any) => err instanceof UnauthorizedException && /expired/.test(err.message)
      );
    });

    it('should successfully parse valid token payload with all claims verified', async () => {
      const mockOAuth2Client = {
        verifyIdToken: async () => ({
          getPayload: () => ({
            iss: 'https://accounts.google.com',
            aud: 'test-client-id.apps.googleusercontent.com',
            sub: 'google-sub-998877',
            email: 'Valid.User@Example.com',
            email_verified: true,
            exp: Math.floor(Date.now() / 1000) + 3600,
            name: 'Valid User',
            picture: 'https://lh3.googleusercontent.com/avatar.jpg',
          }),
        }),
      } as any;

      process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const service = new GoogleAuthService();
      service.setOAuth2Client(mockOAuth2Client);

      const user = await service.verifyIdToken('valid-token');
      assert.equal(user.googleId, 'google-sub-998877');
      assert.equal(user.email, 'valid.user@example.com');
      assert.equal(user.fullName, 'Valid User');
      assert.equal(user.avatarUrl, 'https://lh3.googleusercontent.com/avatar.jpg');
    });
  });

  describe('AuthService Google Login & Onboarding Behavior (Connected Tests)', () => {
    it('should provision brand-new Google user without companies or privileged roles', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: googleSubNew,
        email: newGoogleEmail,
        fullName: 'New Google User',
        avatarUrl: 'https://lh3.googleusercontent.com/avatar_new.jpg',
      });

      const res = await authService.loginWithGoogle({ idToken: 'valid-google-id-token' });

      assert.ok(res.accessToken);
      assert.ok(res.refreshToken);
      assert.ok(res.csrfToken);
      assert.equal(res.user.email, newGoogleEmail);
      assert.equal(res.user.status, 'active');

      newGoogleUserId = res.user.id;

      // Verify user document in MongoDB
      const stored = await User.findById(res.user.id).lean();
      assert.ok(stored);
      assert.equal(stored!.googleId, googleSubNew);
      assert.equal(stored!.authProvider, 'google');
      assert.equal(stored!.passwordHash, '');

      // Verify getMe returns ZERO companies -> guarantees redirect to /onboarding
      const me = await authService.getMe(res.user.id);
      assert.equal(me.companies.length, 0);
    });

    it('should disallow empty password login for Google-only users', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await assert.rejects(
        async () => authService.login({ email: newGoogleEmail, password: '' }),
        (err: any) => err instanceof UnauthorizedException && /Google Sign-In/.test(err.message)
      );
    });

    it('should reject Google login for suspended accounts', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: googleSubSuspended,
        email: suspendedGoogleEmail,
        fullName: 'Suspended Google User',
      });

      await assert.rejects(
        async () => authService.loginWithGoogle({ idToken: 'valid-token' }),
        (err: any) => err instanceof UnauthorizedException && /suspended/.test(err.message)
      );
    });
  });

  describe('Strict Account Linking Security (Requirement 4)', () => {
    it('CRITICAL: should NEVER automatically link existing password account when Google email matches', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Present Google token matching existingPasswordEmail
      mockGoogleService.setMockResult({
        googleId: googleSubExisting,
        email: existingPasswordEmail,
        fullName: 'Existing Local User',
      });

      // Must throw ConflictException with ACCOUNT_EXISTS_LINK_REQUIRED
      await assert.rejects(
        async () => authService.loginWithGoogle({ idToken: 'valid-token-matching-existing-email' }),
        (err: any) => {
          return (
            err instanceof ConflictException &&
            (err.getResponse() as any)?.code === 'ACCOUNT_EXISTS_LINK_REQUIRED'
          );
        }
      );

      // Verify account was NOT mutated
      const unchanged = await User.findById(existingPasswordUserId).lean();
      assert.equal(unchanged!.googleId, undefined);
      assert.equal(unchanged!.authProvider, 'local');
    });

    it('should reject account linking if incorrect password is provided', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: googleSubExisting,
        email: existingPasswordEmail,
        fullName: 'Existing Local User',
      });

      await assert.rejects(
        async () =>
          authService.linkGoogleAccount({
            idToken: 'valid-token',
            password: 'WrongPassword999!',
          }),
        (err: any) => err instanceof UnauthorizedException && /Invalid password/.test(err.message)
      );
    });

    it('should successfully link account when correct password is provided and preserve passwordHash', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: googleSubExisting,
        email: existingPasswordEmail,
        fullName: 'Existing Local User',
      });

      const res = await authService.linkGoogleAccount({
        idToken: 'valid-token',
        password: existingPasswordPlain,
      });

      assert.ok(res.accessToken);
      assert.equal(res.user.email, existingPasswordEmail);

      // Verify MongoDB document has googleId, authProvider: both, and passwordHash intact
      const updated = await User.findById(existingPasswordUserId).lean();
      assert.equal(updated!.googleId, googleSubExisting);
      assert.equal(updated!.authProvider, 'both');
      const isMatch = await bcrypt.compare(existingPasswordPlain, updated!.passwordHash);
      assert.equal(isMatch, true);
    });

    it('should reject linking if Google identity is already linked to another user', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Try linking googleSubNew (already owned by newGoogleUserId) to a different user
      mockGoogleService.setMockResult({
        googleId: googleSubNew,
        email: existingPasswordEmail,
        fullName: 'Duplicate Link Attempter',
      });

      await assert.rejects(
        async () =>
          authService.linkGoogleAccount({
            idToken: 'valid-token',
            password: existingPasswordPlain,
          }),
        (err: any) => err instanceof ConflictException && /already linked to a different/.test(err.message)
      );
    });

    it('subsequent Google login for linked account should log in smoothly', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: googleSubExisting,
        email: existingPasswordEmail,
        fullName: 'Existing Local User',
      });

      const res = await authService.loginWithGoogle({ idToken: 'valid-token' });
      assert.equal(res.user.id, existingPasswordUserId);
      assert.equal(res.user.email, existingPasswordEmail);
    });
  });

  describe('Session Preservation: Cookies, Refresh Rotation, and Logout for Google Users', () => {
    let googleRefreshToken = '';
    let googleSessionFamily = '';

    it('AuthController: should set HttpOnly cookies and sanitize JSON for web clients', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: googleSubNew,
        email: newGoogleEmail,
        fullName: 'New Google User',
      });

      const cookiesSet: Record<string, any> = {};
      const mockRes = {
        cookie: (name: string, val: string, opts: any) => {
          cookiesSet[name] = { val, opts };
        },
      } as any;

      const mockReq = {
        headers: {
          'x-client-type': 'web',
          'user-agent': 'Mozilla/5.0 TestBrowser',
          'x-forwarded-for': '127.0.0.1',
        },
      } as any;

      const result = await authController.googleLogin(
        { idToken: 'valid-google-id-token' },
        mockReq,
        mockRes
      );

      // Verify tokens are sanitized out of JSON for web clients
      assert.equal((result as any).accessToken, undefined);
      assert.equal((result as any).refreshToken, undefined);
      assert.ok(result.csrfToken);
      assert.equal(result.user.email, newGoogleEmail);

      // Verify HttpOnly cookies are set
      assert.ok(cookiesSet['access_token']);
      assert.equal(cookiesSet['access_token'].opts.httpOnly, true);
      assert.equal(cookiesSet['access_token'].opts.path, '/');

      assert.ok(cookiesSet['refresh_token']);
      assert.equal(cookiesSet['refresh_token'].opts.httpOnly, true);
      assert.equal(cookiesSet['refresh_token'].opts.path, '/api/auth');

      assert.ok(cookiesSet['csrf_token']);
      assert.equal(cookiesSet['csrf_token'].opts.httpOnly, false);

      googleRefreshToken = cookiesSet['refresh_token'].val;
      googleSessionFamily = result.sessionFamily;
    });

    it('AuthService: should rotate refresh token for Google session', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const refreshed = await authService.refresh(googleRefreshToken);
      assert.ok(refreshed.accessToken);
      assert.ok(refreshed.refreshToken);
      assert.notEqual(refreshed.refreshToken, googleRefreshToken);
      assert.equal(refreshed.sessionFamily, googleSessionFamily);

      googleRefreshToken = refreshed.refreshToken;
    });

    it('AuthController: should logout Google session and clear cookies', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const clearedCookies: Record<string, any> = {};
      const mockRes = {
        clearCookie: (name: string, opts: any) => {
          clearedCookies[name] = opts;
        },
      } as any;

      const mockReq = {
        cookies: { refresh_token: googleRefreshToken },
        headers: {},
      } as any;

      const logoutResult = await authController.logout(
        { sub: newGoogleUserId, email: newGoogleEmail, fullName: 'New Google User', sessionFamily: googleSessionFamily },
        { refreshToken: googleRefreshToken },
        mockReq,
        mockRes
      );

      assert.equal(logoutResult.success, true);
      assert.ok(clearedCookies['access_token']);
      assert.ok(clearedCookies['refresh_token']);
      assert.ok(clearedCookies['csrf_token']);

      // Session in database must now be marked revoked
      const session = await UserSession.findOne({ sessionFamily: googleSessionFamily }).lean();
      assert.ok(session);
      assert.equal(session!.isRevoked, true);
    });
  });

  describe('Google Account Linking Rate Limiting & Abuse Prevention', () => {
    const rateLimitTestEmail = `rate_limit_${Date.now()}@test.ae`;
    const rateLimitPlainPassword = 'CorrectPassword123!';
    let rateLimitUserId = '';
    const rateLimitGoogleSub = `sub_rate_limit_${Date.now()}`;
    const testIpA = '198.51.100.1';
    const testIpB = '198.51.100.2';

    before(async () => {
      if (mongoose.connection.readyState === 1) {
        const passwordHash = await bcrypt.hash(rateLimitPlainPassword, 10);
        const user = await User.create({
          email: rateLimitTestEmail,
          passwordHash,
          fullName: 'Rate Limit Test User',
          status: 'active',
          authProvider: 'local',
        });
        rateLimitUserId = user._id.toString();
      }
    });

    after(async () => {
      if (mongoose.connection.readyState === 1) {
        if (rateLimitUserId) await User.deleteOne({ _id: rateLimitUserId });
        await UserSession.deleteMany({ userId: rateLimitUserId });
      }
      authService.resetAccountLinkFailuresForTesting();
    });

    it('should track repeated failed password attempts and allow up to 5 failures', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: rateLimitGoogleSub,
        email: rateLimitTestEmail,
        fullName: 'Rate Limit Test User',
      });

      // Attempt 1 through 5 with wrong password
      for (let i = 1; i <= 5; i++) {
        await assert.rejects(
          async () =>
            authService.linkGoogleAccount(
              { idToken: 'valid-token', password: `WrongAttempt_${i}` },
              { ipAddress: testIpA }
            ),
          (err: any) => err instanceof UnauthorizedException && /Invalid password/.test(err.message)
        );
      }

      // Verify failure tracker has recorded exactly 5 timestamps
      const trackerKey = `${rateLimitTestEmail.toLowerCase()}:${testIpA.toLowerCase()}`;
      const failures = authService.getAccountLinkFailuresForTesting(trackerKey);
      assert.ok(failures);
      assert.equal(failures.length, 5);
    });

    it('should reject the 6th failed attempt with HTTP 429 Too Many Requests', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: rateLimitGoogleSub,
        email: rateLimitTestEmail,
        fullName: 'Rate Limit Test User',
      });

      // 6th attempt from testIpA should be blocked by rate limit BEFORE verifying password
      await assert.rejects(
        async () =>
          authService.linkGoogleAccount(
            { idToken: 'valid-token', password: 'WrongAttempt_6' },
            { ipAddress: testIpA }
          ),
        (err: any) => {
          assert.ok(err instanceof HttpException);
          assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
          assert.match(err.message, /Too many failed account-linking attempts/);
          return true;
        }
      );
    });

    it('should not lock out unrelated client IP for the same user', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: rateLimitGoogleSub,
        email: rateLimitTestEmail,
        fullName: 'Rate Limit Test User',
      });

      // Attempt from testIpB (different IP) should NOT receive 429; it should proceed to normal password check
      await assert.rejects(
        async () =>
          authService.linkGoogleAccount(
            { idToken: 'valid-token', password: 'WrongPasswordFromIpB' },
            { ipAddress: testIpB }
          ),
        (err: any) => {
          // Should be 401 Unauthorized, NOT 429 Too Many Requests
          assert.ok(err instanceof UnauthorizedException);
          assert.equal(err.getStatus(), HttpStatus.UNAUTHORIZED);
          return true;
        }
      );
    });

    it('AuthController: should safely extract first client IP from proxy x-forwarded-for chain', async () => {
      if (mongoose.connection.readyState !== 1) return;

      mockGoogleService.setMockResult({
        googleId: rateLimitGoogleSub,
        email: rateLimitTestEmail,
        fullName: 'Rate Limit Test User',
      });

      // Controller request presenting x-forwarded-for with client IP testIpA
      const mockReq = {
        headers: {
          'x-forwarded-for': `${testIpA}, 10.0.0.1, 172.16.0.1`,
          'user-agent': 'RateLimitTestAgent/1.0',
        },
      } as any;
      const mockRes = { cookie: () => {} } as any;

      // Since testIpA already exhausted 5 attempts, controller call should throw 429
      await assert.rejects(
        async () =>
          authController.googleLink(
            { idToken: 'valid-token', password: 'AnyPassword' },
            mockReq,
            mockRes
          ),
        (err: any) => {
          assert.ok(err instanceof HttpException);
          assert.equal(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
          return true;
        }
      );
    });

    it('unaffected existing auth routes: standard email/password login still functions normally', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Normal login endpoint should NOT be affected by Google linking rate limit
      const loginRes = await authService.login(
        { email: rateLimitTestEmail, password: rateLimitPlainPassword },
        { ipAddress: testIpA }
      );
      assert.ok(loginRes.accessToken);
      assert.equal(loginRes.user.email, rateLimitTestEmail);
    });

    it('sliding window: pruning expired entries removes old failure records', () => {
      const now = Date.now();
      const testKey = 'prune_test@test.ae:127.0.0.1';

      // Record a failure 61 seconds in the past
      (authService as any).accountLinkFailures.set(testKey, [now - 61000]);

      // Pruning should remove the expired entry
      authService.pruneExpiredRotations(now);
      const remaining = authService.getAccountLinkFailuresForTesting(testKey);
      assert.equal(remaining, undefined);
    });

    it('successful account linking clears the failure counter immediately', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Reset testIpA's failure bucket to simulate window expiry or retry
      authService.resetAccountLinkFailuresForTesting();

      // Record 2 failed attempts
      await assert.rejects(
        async () =>
          authService.linkGoogleAccount(
            { idToken: 'valid-token', password: 'WrongPassword' },
            { ipAddress: testIpA }
          ),
        (err: any) => err instanceof UnauthorizedException
      );
      await assert.rejects(
        async () =>
          authService.linkGoogleAccount(
            { idToken: 'valid-token', password: 'WrongPassword' },
            { ipAddress: testIpA }
          ),
        (err: any) => err instanceof UnauthorizedException
      );

      const trackerKey = `${rateLimitTestEmail.toLowerCase()}:${testIpA.toLowerCase()}`;
      assert.equal(authService.getAccountLinkFailuresForTesting(trackerKey)?.length, 2);

      // Now succeed with correct password
      mockGoogleService.setMockResult({
        googleId: rateLimitGoogleSub,
        email: rateLimitTestEmail,
        fullName: 'Rate Limit Test User',
      });

      const linkResult = await authService.linkGoogleAccount(
        { idToken: 'valid-token', password: rateLimitPlainPassword },
        { ipAddress: testIpA }
      );

      assert.ok(linkResult.accessToken);
      assert.equal(linkResult.user.email, rateLimitTestEmail);

      // Failure counter must now be completely cleared
      assert.equal(authService.getAccountLinkFailuresForTesting(trackerKey), undefined);
    });
  });
});
