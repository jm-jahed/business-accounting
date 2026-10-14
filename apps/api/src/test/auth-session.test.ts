import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  dbManager,
  User,
  Company,
  CompanyMembership,
  UserSession,
  assertTestDatabase,
  DatabaseConfigurationError,
} from '@accounting/database';
import { JwtService, validateJwtConfig, JwtConfigurationError } from '../auth/jwt.service.js';
import { AuthService } from '../auth/auth.service.js';
import { AuthController } from '../auth/auth.controller.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';

function createMockExecutionContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('Phase 1: Secure Backend Authentication & Session Foundation Suite', () => {
  const jwtService = new JwtService();
  const authService = new AuthService(jwtService);
  const authController = new AuthController(authService);
  const jwtGuard = new JwtAuthGuard(jwtService);
  const tenantGuard = new TenantGuard();


  const testEmail = `auth_test_${Date.now()}@accounting-test.ae`;
  const suspendedEmail = `suspended_${Date.now()}@accounting-test.ae`;
  let testUserId = '';
  let suspendedUserId = '';
  let activeRefreshToken = '';
  let activeSessionFamily = '';


  const testCompanySlug = `sec-store-${Date.now().toString().slice(-4)}`;
  let testCompanyId = '';

  before(async () => {
    if (process.env.MONGODB_URI) {
      const dbName = process.env.DB_NAME || 'business_accounting_test';
      assertTestDatabase(dbName);
      await dbManager.connect();

      // Seed active user
      const user = await User.create({
        email: testEmail,
        passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5r5Uq.UeG3aJz8uU6/97b37v3tq', // 'ValidPass123!'
        fullName: 'Zubair Al-Farsi',
        status: 'active',
      });
      testUserId = user._id.toString();

      // Seed suspended user
      const suspended = await User.create({
        email: suspendedEmail,
        passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5r5Uq.UeG3aJz8uU6/97b37v3tq',
        fullName: 'Suspended Account',
        status: 'suspended',
      });
      suspendedUserId = suspended._id.toString();

      // Seed company for cross-tenant tests
      const comp = await Company.create({
        name: 'Secure Vault LLC',
        slug: testCompanySlug,
        legalName: 'Secure Vault General Trading LLC',
        currency: 'AED',
        status: 'active',
      });
      testCompanyId = comp._id.toString();

      // Add membership for test user only
      await CompanyMembership.create({
        userId: testUserId,
        companyId: testCompanyId,
        role: 'owner',
        status: 'active',
        branchAccess: 'all',
      });
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      if (testUserId) {
        await User.deleteOne({ _id: testUserId });
        await UserSession.deleteMany({ userId: testUserId });
      }
      if (suspendedUserId) {
        await User.deleteOne({ _id: suspendedUserId });
        await UserSession.deleteMany({ userId: suspendedUserId });
      }
      if (testCompanyId) {
        await Company.deleteOne({ _id: testCompanyId });
        await CompanyMembership.deleteMany({ companyId: testCompanyId });
      }
    }
  });

  // --------------------------------------------------------------------------
  // 1. Production Secrets Configuration & Safety Guard Tests
  // --------------------------------------------------------------------------
  it('Security: should reject missing or insecure JWT secrets in production', () => {
    // Missing access secret
    assert.throws(
      () => validateJwtConfig({ NODE_ENV: 'production', JWT_ACCESS_SECRET: '', JWT_REFRESH_SECRET: 'a'.repeat(32) }),
      (err: any) => err instanceof JwtConfigurationError && /JWT_ACCESS_SECRET is required/.test(err.message)
    );

    // Secret too short (< 32 chars)
    assert.throws(
      () => validateJwtConfig({ NODE_ENV: 'production', JWT_ACCESS_SECRET: 'short_key_123', JWT_REFRESH_SECRET: 'a'.repeat(32) }),
      (err: any) => err instanceof JwtConfigurationError && /at least 32 characters/.test(err.message)
    );

    // Identical access and refresh secrets
    const identicalSecret = 'secret_identical_key_must_be_different_at_least_32_chars';
    assert.throws(
      () => validateJwtConfig({ NODE_ENV: 'production', JWT_ACCESS_SECRET: identicalSecret, JWT_REFRESH_SECRET: identicalSecret }),
      (err: any) => err instanceof JwtConfigurationError && /distinct secrets/.test(err.message)
    );

    // Valid configuration in production
    const validConfig = validateJwtConfig({
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'valid_prod_access_secret_key_exceeding_32_chars!',
      JWT_REFRESH_SECRET: 'valid_prod_refresh_secret_key_exceeding_32_chars!',
    });
    assert.equal(validConfig.accessSecret, 'valid_prod_access_secret_key_exceeding_32_chars!');
  });

  it('Security: should enforce test-database _test safety invariant', () => {
    // Non-test database must throw
    assert.throws(
      () => assertTestDatabase('business_accounting'),
      (err: any) => err instanceof DatabaseConfigurationError && /Safety Violation/.test(err.message)
    );
    assert.throws(
      () => assertTestDatabase('production_data_cluster'),
      (err: any) => err instanceof DatabaseConfigurationError
    );

    // Valid test database must succeed
    assert.doesNotThrow(() => assertTestDatabase('business_accounting_test'));
    assert.doesNotThrow(() => assertTestDatabase('staging_automated_test'));
  });

  // --------------------------------------------------------------------------
  // 2. Authentication: Valid, Invalid & Inactive User Credentials
  // --------------------------------------------------------------------------
  it('AuthService: should reject login with invalid password', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await assert.rejects(
      async () => {
        await authService.login({ email: testEmail, password: 'WrongPassword999!' });
      },
      (err: any) => err instanceof UnauthorizedException && /Invalid email address or password/.test(err.message)
    );
  });

  it('AuthService: should reject login with non-existent email', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await assert.rejects(
      async () => {
        await authService.login({ email: 'nonexistent_user_999@test.ae', password: 'ValidPass123!' });
      },
      (err: any) => err instanceof UnauthorizedException && /Invalid email address or password/.test(err.message)
    );
  });

  it('AuthService: should reject login for suspended/inactive user', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await assert.rejects(
      async () => {
        await authService.login({ email: suspendedEmail, password: 'ValidPass123!' });
      },
      (err: any) => err instanceof UnauthorizedException && /suspended/.test(err.message)
    );
  });

  // --------------------------------------------------------------------------
  // 3. Session Creation, Storage Hashing & Expiration
  // --------------------------------------------------------------------------
  it('AuthService: should authenticate valid user, persist session hash, and issue tokens', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await authService.login(
      { email: testEmail, password: 'ValidPass123!' },
      { ipAddress: '192.168.1.100', userAgent: 'AccountingDesktop/1.0' }
    );

    assert.ok(res.accessToken);
    assert.ok(res.refreshToken);
    assert.ok(res.csrfToken);
    assert.ok(res.sessionFamily);
    assert.equal(res.user.email, testEmail);

    activeRefreshToken = res.refreshToken;
    activeSessionFamily = res.sessionFamily;

    // Verify session document in MongoDB
    const session = await UserSession.findOne({ sessionFamily: res.sessionFamily });
    assert.ok(session, 'UserSession document must be persisted in database');
    assert.equal(session!.userId.toString(), testUserId);
    assert.equal(session!.isRevoked, false);
    assert.equal(session!.ipAddress, '192.168.1.100');
    assert.equal(session!.userAgent, 'AccountingDesktop/1.0');

    // CRITICAL: Verify raw refresh token is NEVER stored; only cryptographic SHA-256 hash is saved
    assert.notEqual(session!.refreshTokenHash, res.refreshToken);
    const expectedHash = jwtService.hashToken(res.refreshToken);
    assert.equal(session!.refreshTokenHash, expectedHash);
  });

  // --------------------------------------------------------------------------
  // 4. Valid Refresh & Token Rotation
  // --------------------------------------------------------------------------
  it('AuthService: should rotate refresh token and update session hash upon valid refresh', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const oldToken = activeRefreshToken;
    const oldHash = jwtService.hashToken(oldToken);

    const refreshRes = await authService.refresh(oldToken, {
      ipAddress: '192.168.1.101',
      userAgent: 'AccountingWeb/2.0',
    });

    assert.ok(refreshRes.accessToken);
    assert.ok(refreshRes.refreshToken);
    assert.notEqual(refreshRes.refreshToken, oldToken, 'Rotated refresh token must be different from previous');

    // Verify database session was updated with new token hash
    const session = await UserSession.findOne({ sessionFamily: activeSessionFamily });
    assert.ok(session);
    assert.notEqual(session!.refreshTokenHash, oldHash, 'Old token hash must be replaced');
    const newExpectedHash = jwtService.hashToken(refreshRes.refreshToken);
    assert.equal(session!.refreshTokenHash, newExpectedHash);

    // Save rotated token for subsequent tests
    activeRefreshToken = refreshRes.refreshToken;
  });

  // --------------------------------------------------------------------------
  // 5. Refresh Token Reuse Detection & Session Family Revocation
  // --------------------------------------------------------------------------
  it('CRITICAL Security: should detect token reuse of an old rotated token and revoke session family', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Generate an authentic older refresh token in the same session family
    const staleRefreshToken = jwtService.signRefreshToken({
      sub: testUserId,
      email: testEmail,
      fullName: 'Zubair Al-Farsi',
      sessionFamily: activeSessionFamily,
      jti: 'stale-token-replay',
    });

    // Attempt to refresh with the stale token (stale hash != active session hash)
    await assert.rejects(
      async () => {
        await authService.refresh(staleRefreshToken);
      },
      (err: any) =>
        err instanceof UnauthorizedException && /Refresh token reuse detected/.test(err.message)
    );

    // Verify session family is now revoked
    const session = await UserSession.findOne({ sessionFamily: activeSessionFamily });
    assert.ok(session);
    assert.equal(session!.isRevoked, true);
    assert.equal(session!.revokedReason, 'Token reuse detected');
    assert.ok(session!.revokedAt);

    // Verify subsequent refresh attempts with ANY token in this family fail
    await assert.rejects(
      async () => {
        await authService.refresh(activeRefreshToken);
      },
      (err: any) => err instanceof UnauthorizedException && /revoked/.test(err.message)
    );
  });

  // --------------------------------------------------------------------------
  // 6. Logout & Revoked Session Rejection in JwtAuthGuard
  // --------------------------------------------------------------------------
  it('AuthService: should revoke session upon logout and JwtAuthGuard should reject revoked token', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Log in again to get a fresh active session
    const freshLogin = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const freshToken = freshLogin.accessToken;
    const freshFamily = freshLogin.sessionFamily;

    // Guard should accept the fresh token
    const mockReq = {
      headers: { authorization: `Bearer ${freshToken}` },
      cookies: {},
      method: 'GET',
    };
    const canActivate = await jwtGuard.canActivate(createMockExecutionContext(mockReq));
    assert.equal(canActivate, true);

    // Perform logout
    const logoutRes = await authService.logout({
      userId: testUserId,
      sessionFamily: freshFamily,
    });
    assert.equal(logoutRes.success, true);

    // Guard MUST reject the revoked session token on subsequent requests
    await assert.rejects(
      async () => {
        await jwtGuard.canActivate(createMockExecutionContext(mockReq));
      },
      (err: any) => err instanceof UnauthorizedException && /revoked/.test(err.message)
    );
  });

  // --------------------------------------------------------------------------
  // 7. CSRF Protection for Cookie-Authenticated State Changes
  // --------------------------------------------------------------------------
  it('JwtAuthGuard: should enforce CSRF token validation on cookie-authenticated mutating requests', async () => {
    const validCsrf = jwtService.generateCsrfToken();
    const token = jwtService.signAccessToken({
      sub: '507f1f77bcf86cd799439011',
      email: 'cookie_user@test.ae',
      fullName: 'Cookie User',
    });

    // 1. Mutating POST with missing CSRF header -> REJECTED
    const reqMissingHeader = {
      headers: {},
      cookies: { access_token: token, csrf_token: validCsrf },
      method: 'POST',
    };
    await assert.rejects(
      async () => {
        await jwtGuard.canActivate(createMockExecutionContext(reqMissingHeader));
      },
      (err: any) => err instanceof ForbiddenException && /CSRF/.test(err.message)
    );

    // 2. Mutating POST with mismatched CSRF header -> REJECTED
    const reqMismatched = {
      headers: { 'x-csrf-token': 'wrong-csrf-token-attempt' },
      cookies: { access_token: token, csrf_token: validCsrf },
      method: 'POST',
    };
    await assert.rejects(
      async () => {
        await jwtGuard.canActivate(createMockExecutionContext(reqMismatched));
      },
      (err: any) => err instanceof ForbiddenException && /CSRF/.test(err.message)
    );

    // 3. Mutating POST with matching CSRF header -> ACCEPTED
    const reqValidPost = {
      headers: { 'x-csrf-token': validCsrf },
      cookies: { access_token: token, csrf_token: validCsrf },
      method: 'POST',
    };
    const postAccepted = await jwtGuard.canActivate(createMockExecutionContext(reqValidPost));
    assert.equal(postAccepted, true);

    // 4. Safe GET request via Cookie -> ACCEPTED without CSRF header
    const reqSafeGet = {
      headers: {},
      cookies: { access_token: token, csrf_token: validCsrf },
      method: 'GET',
    };
    const getAccepted = await jwtGuard.canActivate(createMockExecutionContext(reqSafeGet));
    assert.equal(getAccepted, true);
  });

  // --------------------------------------------------------------------------
  // 8. Continued Bearer-Token Compatibility
  // --------------------------------------------------------------------------
  it('JwtAuthGuard: should maintain seamless Bearer token compatibility without requiring CSRF', async () => {
    const bearerToken = jwtService.signAccessToken({
      sub: '507f1f77bcf86cd799439011',
      email: 'bearer_client@test.ae',
      fullName: 'Mobile POS Client',
    });

    // Mutating POST with Bearer header but ZERO cookies or CSRF headers -> MUST SUCCEED
    const reqBearer = {
      headers: { authorization: `Bearer ${bearerToken}` },
      cookies: {},
      method: 'POST',
    };

    const accepted = await jwtGuard.canActivate(createMockExecutionContext(reqBearer));
    assert.equal(accepted, true);
    assert.equal((reqBearer as any).user?.email, 'bearer_client@test.ae');
    assert.equal((reqBearer as any).authType, 'bearer');
  });

  // --------------------------------------------------------------------------
  // 9. Cross-Tenant Access Rejection
  // --------------------------------------------------------------------------
  it('TenantGuard: should reject authenticated user attempting to access foreign company', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const foreignSlug = `foreign-store-${Date.now().toString().slice(-4)}`;
    const foreignComp = await Company.create({
      name: 'Foreign Store LLC',
      slug: foreignSlug,
      legalName: 'Foreign Store Trading LLC',
      currency: 'AED',
      status: 'active',
    });

    try {
      // User is authenticated, but possesses NO membership in foreign store
      const req = {
        user: { sub: testUserId, email: testEmail, fullName: 'Zubair Al-Farsi' },
        params: { storeSlug: foreignSlug },
        headers: {},
      };

      await assert.rejects(
        async () => {
          await tenantGuard.canActivate(createMockExecutionContext(req));
        },
        (err: any) =>
          err instanceof ForbiddenException && /not an authorized member/.test(err.message)
      );
    } finally {
      await Company.deleteOne({ _id: foreignComp._id });
    }
  });

  // --------------------------------------------------------------------------
  // 10. AuthController Logout Integration & Cookie Path Revocation
  // --------------------------------------------------------------------------
  it('AuthController: should clear cookies with path /api/auth and revoke session in MongoDB on logout', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create a fresh active session
    const freshLogin = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const sessionFamily = freshLogin.sessionFamily;

    const clearedCookies: Record<string, any> = {};
    const mockRes: any = {
      clearCookie: (name: string, options: any) => {
        clearedCookies[name] = options;
      },
    };
    const mockReq: any = {
      headers: {},
      cookies: { refresh_token: freshLogin.refreshToken },
    };

    const logoutResult = await authController.logout(
      { sub: testUserId, sessionFamily, email: testEmail, fullName: 'Zubair' },
      {},
      mockReq,
      mockRes
    );

    assert.equal(logoutResult.success, true);

    // Verify cookie paths and security options match setAuthCookies
    assert.equal(clearedCookies['access_token']?.path, '/');
    assert.equal(clearedCookies['access_token']?.httpOnly, true);
    assert.equal(clearedCookies['access_token']?.sameSite, 'lax');

    assert.equal(clearedCookies['refresh_token']?.path, '/api/auth');
    assert.equal(clearedCookies['refresh_token']?.httpOnly, true);
    assert.equal(clearedCookies['refresh_token']?.sameSite, 'lax');

    assert.equal(clearedCookies['csrf_token']?.path, '/');
    assert.equal(clearedCookies['csrf_token']?.httpOnly, false);
    assert.equal(clearedCookies['csrf_token']?.sameSite, 'lax');

    // Verify session in MongoDB is revoked
    const session = await UserSession.findOne({ sessionFamily });
    assert.ok(session);
    assert.equal(session!.isRevoked, true);
    assert.equal(session!.revokedReason, 'User logged out');
  });

  // --------------------------------------------------------------------------
  // 11. Concurrency: Simultaneous In-Flight Refresh & Grace Window Protection
  // --------------------------------------------------------------------------
  it('AuthService Concurrency: Two simultaneous concurrent refresh requests using the same token must return identical token pairs without conflict or revocation', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Initial login
    const login = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const initialToken = login.refreshToken;
    const sessionFamily = login.sessionFamily;

    // 1. Two concurrent refresh requests executed simultaneously using the same initial token
    const [res1, res2] = await Promise.all([
      authService.refresh(initialToken, { ipAddress: '192.168.1.10', userAgent: 'BrowserTab1' }),
      authService.refresh(initialToken, { ipAddress: '192.168.1.10', userAgent: 'BrowserTab2' }),
    ]);

    // Critical assertion: both requests must receive the exact same active token pair (no conflicting pairs)
    assert.ok(res1.accessToken);
    assert.ok(res2.accessToken);
    assert.equal(res1.accessToken, res2.accessToken, 'Concurrent refresh must return identical accessToken');
    assert.equal(res1.refreshToken, res2.refreshToken, 'Concurrent refresh must return identical refreshToken');
    assert.equal(res1.csrfToken, res2.csrfToken, 'Concurrent refresh must return identical csrfToken');
    assert.notEqual(res1.refreshToken, initialToken, 'Rotated token must differ from initial token');

    // 2. Resulting token/session state verification in MongoDB
    const session = await UserSession.findOne({ sessionFamily });
    assert.ok(session, 'UserSession must exist in database');
    assert.equal(session!.isRevoked, false, 'Session must remain active without false-positive revocation');
    assert.equal(session!.previousTokenHash, jwtService.hashToken(initialToken), 'previousTokenHash must match initial token');
    assert.equal(session!.refreshTokenHash, jwtService.hashToken(res1.refreshToken), 'refreshTokenHash must match new shared token');
    assert.ok(session!.rotatedAt, 'rotatedAt timestamp must be recorded');

    // 3. Retry within 30-second grace window after completion returns identical token pair
    const retryRes = await authService.refresh(initialToken);
    assert.equal(retryRes.refreshToken, res1.refreshToken, 'Retry within grace window must return identical active token');

    // 4. Subsequent refresh behavior using the new shared token succeeds normally
    const res3 = await authService.refresh(res1.refreshToken);
    assert.ok(res3.accessToken);
    assert.ok(res3.refreshToken);
    assert.notEqual(res3.refreshToken, res1.refreshToken, 'Subsequent refresh must rotate to a new token');

    // Verify session state updated for rotation 3
    const sessionAfterThird = await UserSession.findOne({ sessionFamily });
    assert.ok(sessionAfterThird);
    assert.equal(sessionAfterThird!.isRevoked, false);
    assert.equal(sessionAfterThird!.previousTokenHash, jwtService.hashToken(res1.refreshToken));
    assert.equal(sessionAfterThird!.refreshTokenHash, jwtService.hashToken(res3.refreshToken));

    // 5. Genuine replay after rotation: attempting to replay initialToken (now older than previousTokenHash)
    // MUST trigger immediate session family revocation
    await assert.rejects(
      async () => {
        await authService.refresh(initialToken);
      },
      (err: any) =>
        err instanceof UnauthorizedException && /Refresh token reuse detected/.test(err.message)
    );

    // Verify database document was marked revoked with reason
    const revokedSession = await UserSession.findOne({ sessionFamily });
    assert.ok(revokedSession);
    assert.equal(revokedSession!.isRevoked, true);
    assert.equal(revokedSession!.revokedReason, 'Token reuse detected');

    // Verify subsequent refresh attempts with the latest token are now rejected
    await assert.rejects(
      async () => {
        await authService.refresh(res3.refreshToken);
      },
      (err: any) => err instanceof UnauthorizedException && /revoked/.test(err.message)
    );
  });

  // --------------------------------------------------------------------------
  // 12. Web Client Token Suppression in JSON Response
  // --------------------------------------------------------------------------
  it('AuthController: should omit both accessToken and refreshToken from JSON response body when x-client-type is web, while retaining them for native clients', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // 1. Web client request (x-client-type: web)
    const mockWebReq: any = {
      headers: { 'x-client-type': 'web' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    const webCookies: Record<string, any> = {};
    const mockWebRes: any = {
      cookie: (name: string, val: string, opts: any) => {
        webCookies[name] = { val, opts };
      },
    };

    const webLoginRes: any = await authController.login(
      { email: testEmail, password: 'ValidPass123!' },
      mockWebReq,
      mockWebRes
    );

    // Verify cookies are still set
    assert.ok(webCookies['access_token']);
    assert.ok(webCookies['refresh_token']);
    assert.ok(webCookies['csrf_token']);

    // Crucial: neither accessToken nor refreshToken must be exposed in JSON response body for web clients
    assert.equal(webLoginRes.accessToken, undefined, 'Web client JSON response must suppress raw accessToken');
    assert.equal(webLoginRes.refreshToken, undefined, 'Web client JSON response must suppress raw refreshToken');
    assert.ok(webLoginRes.csrfToken);
    assert.ok(webLoginRes.user);

    // 2. Native client request (no x-client-type or mobile)
    const mockNativeReq: any = {
      headers: { 'x-client-type': 'mobile-pos' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    const mockNativeRes: any = {
      cookie: () => {},
    };

    const nativeLoginRes: any = await authController.login(
      { email: testEmail, password: 'ValidPass123!' },
      mockNativeReq,
      mockNativeRes
    );

    // Native clients MUST receive the full token pair in the JSON body
    assert.ok(nativeLoginRes.accessToken, 'Native client must receive accessToken in JSON');
    assert.ok(nativeLoginRes.refreshToken, 'Native client must receive refreshToken in JSON');
    assert.ok(nativeLoginRes.csrfToken);
    assert.ok(nativeLoginRes.user);
  });

  // --------------------------------------------------------------------------
  // 13. Expired Session Document Rejection
  // --------------------------------------------------------------------------
  it('AuthService: should reject refresh if session document has expired', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const login = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const sessionFamily = login.sessionFamily;

    // Manually set session expiry in the past
    await UserSession.updateOne(
      { sessionFamily },
      { expiresAt: new Date(Date.now() - 5000) }
    );

    await assert.rejects(
      async () => {
        await authService.refresh(login.refreshToken);
      },
      (err: any) => err instanceof UnauthorizedException && /expired/.test(err.message)
    );
  });

  // --------------------------------------------------------------------------
  // 14. Cache Hardening: Suspended User on Cache Hit
  // --------------------------------------------------------------------------
  it('AuthService Cache Hardening: should reject cache hit and revoke session if user account is suspended during 30s grace window', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Fresh login and initial rotation to populate recentRotations cache
    const login = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const token1 = login.refreshToken;
    const sessionFamily = login.sessionFamily;

    const rotated = await authService.refresh(token1);
    assert.ok(rotated.refreshToken);

    // Verify cache holds rotation
    assert.ok(authService.getCachedEntryForTesting(sessionFamily));

    try {
      // Simulate account suspension while grace window is active
      await User.updateOne({ _id: testUserId }, { status: 'suspended' });

      // Attempt to refresh with token1 (cache hit path)
      await assert.rejects(
        async () => {
          await authService.refresh(token1);
        },
        (err: any) => err instanceof UnauthorizedException && /no longer active/.test(err.message)
      );

      // Verify cache entry was deleted and session in DB is revoked
      assert.equal(authService.getCachedEntryForTesting(sessionFamily), undefined);
      const session = await UserSession.findOne({ sessionFamily });
      assert.ok(session);
      assert.equal(session!.isRevoked, true);
      assert.equal(session!.revokedReason, 'User account suspended or not found');
    } finally {
      // Restore user status to active
      await User.updateOne({ _id: testUserId }, { status: 'active' });
    }
  });

  // --------------------------------------------------------------------------
  // 15. Cache Hardening: Expired Entry Cleanup
  // --------------------------------------------------------------------------
  it('AuthService Cache Hardening: should prune expired entries from recentRotations cache via pruneExpiredRotations and access checks', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const login = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const sessionFamily = login.sessionFamily;

    await authService.refresh(login.refreshToken);
    assert.ok(authService.getCachedEntryForTesting(sessionFamily));

    // Fast-forward simulated time past the 30s expiry
    const futureTime = Date.now() + 35000;
    const pruned = authService.pruneExpiredRotations(futureTime);
    assert.ok(pruned >= 1, 'Should prune at least the expired test session');
    assert.equal(authService.getCachedEntryForTesting(sessionFamily), undefined);
  });

  // --------------------------------------------------------------------------
  // 16. Cache Hardening: Bounded Cache Capacity (Max Cache Size Limit)
  // --------------------------------------------------------------------------
  it('AuthService Cache Hardening: should enforce max cache size limit and evict oldest entries when capacity is exceeded', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Set a small test bound of 2 items
    authService.setMaxCacheSizeForTesting(2);

    try {
      const login1 = await authService.login({ email: testEmail, password: 'ValidPass123!' });
      const family1 = login1.sessionFamily;
      await authService.refresh(login1.refreshToken);

      const login2 = await authService.login({ email: testEmail, password: 'ValidPass123!' });
      const family2 = login2.sessionFamily;
      await authService.refresh(login2.refreshToken);

      assert.equal(authService.getCacheSizeForTesting(), 2);

      // Add a third item; should trigger eviction of the oldest (family1)
      const login3 = await authService.login({ email: testEmail, password: 'ValidPass123!' });
      const family3 = login3.sessionFamily;
      await authService.refresh(login3.refreshToken);

      assert.equal(authService.getCacheSizeForTesting(), 2);
      assert.equal(authService.getCachedEntryForTesting(family1), undefined, 'Oldest entry must be evicted');
      assert.ok(authService.getCachedEntryForTesting(family2));
      assert.ok(authService.getCachedEntryForTesting(family3));
    } finally {
      authService.setMaxCacheSizeForTesting(AuthService.DEFAULT_MAX_CACHE_SIZE);
    }
  });

  // --------------------------------------------------------------------------
  // 17. Cache Hardening: Invalidation on Logout & Revoked Session
  // --------------------------------------------------------------------------
  it('AuthService Cache Hardening: should invalidate cache entry on logout and reject subsequent predecessor token retry', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const login = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const initialToken = login.refreshToken;
    const sessionFamily = login.sessionFamily;

    const rotated = await authService.refresh(initialToken);
    assert.ok(authService.getCachedEntryForTesting(sessionFamily));

    // Logout
    await authService.logout({ userId: testUserId, sessionFamily });

    // Cache entry must be removed
    assert.equal(authService.getCachedEntryForTesting(sessionFamily), undefined);

    // Attempting to refresh with either initial or rotated token must be rejected
    await assert.rejects(
      async () => {
        await authService.refresh(initialToken);
      },
      (err: any) => err instanceof UnauthorizedException && /revoked/.test(err.message)
    );
    await assert.rejects(
      async () => {
        await authService.refresh(rotated.refreshToken);
      },
      (err: any) => err instanceof UnauthorizedException && /revoked/.test(err.message)
    );
  });

  // --------------------------------------------------------------------------
  // 18. Cache Hardening: Reject Cache Hit if Session was Revoked in Database
  // --------------------------------------------------------------------------
  it('AuthService Cache Hardening: should reject predecessor token cache hit if session was revoked in database', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const login = await authService.login({ email: testEmail, password: 'ValidPass123!' });
    const initialToken = login.refreshToken;
    const sessionFamily = login.sessionFamily;

    await authService.refresh(initialToken);
    assert.ok(authService.getCachedEntryForTesting(sessionFamily));

    // Directly revoke session in DB (e.g. by security admin)
    await UserSession.updateOne(
      { sessionFamily },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'Administrative security termination' }
    );

    // Refreshing with predecessor token must check DB, bypass cache, and reject
    await assert.rejects(
      async () => {
        await authService.refresh(initialToken);
      },
      (err: any) => err instanceof UnauthorizedException && /revoked/.test(err.message)
    );
  });
});
