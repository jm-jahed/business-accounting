import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { dbManager, User, Company, Branch, CompanyMembership, CompanyInvitation } from '@accounting/database';
import { JwtService } from '../auth/jwt.service.js';
import { AuthService } from '../auth/auth.service.js';
import { CompanyService } from '../companies/company.service.js';

describe('Phase A: Auth, Company Onboarding, and Tenant Guard Suite', () => {
  const jwtService = new JwtService();
  const authService = new AuthService(jwtService);
  const companyService = new CompanyService();

  const testEmail = `test_${Date.now()}@accounting-test.ae`;
  const inviteeEmail = `invitee_${Date.now()}@accounting-test.ae`;
  let testUserId = '';
  let testAccessToken = '';
  let testCompanyId = '';

  before(async () => {
    if (process.env.MONGODB_URI) {
      await dbManager.connect();
    }
  });

  after(async () => {
    // Clean up created test entities
    if (mongoose.connection.readyState === 1) {
      if (testUserId) {
        await User.deleteOne({ _id: testUserId });
      }
      if (testCompanyId) {
        await Company.deleteOne({ _id: testCompanyId });
        await Branch.deleteMany({ companyId: testCompanyId });
        await CompanyMembership.deleteMany({ companyId: testCompanyId });
        await CompanyInvitation.deleteMany({ companyId: testCompanyId });
      }
      await User.deleteOne({ email: inviteeEmail });
    }
  });

  it('JwtService: should issue and correctly verify valid JWT tokens', () => {
    const payload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'owner@test.ae',
      fullName: 'Chief Financial Officer',
    };

    const token = jwtService.signAccessToken(payload);
    assert.ok(token);
    assert.equal(typeof token, 'string');

    const decoded = jwtService.verifyAccessToken(token);
    assert.equal(decoded.sub, payload.sub);
    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.fullName, payload.fullName);
  });

  it('JwtService: should throw when verifying invalid or tampered tokens', () => {
    assert.throws(() => {
      jwtService.verifyAccessToken('invalid.tampered.token');
    });
  });

  it('AuthService: should register a new user with bcrypt password hashing', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await authService.register({
      email: testEmail,
      password: 'StrongPassword123!',
      fullName: 'Tariq Al-Mansoor',
      phone: '+971501234567',
    });

    assert.ok(res.accessToken);
    assert.ok(res.user.id);
    assert.equal(res.user.email, testEmail);
    assert.equal(res.user.fullName, 'Tariq Al-Mansoor');

    testUserId = res.user.id;
    testAccessToken = res.accessToken;

    const verified = jwtService.verifyAccessToken(testAccessToken);
    assert.equal(verified.sub, testUserId);

    // Verify password is NOT stored in plain text
    const storedUser = await User.findById(testUserId).lean();
    assert.ok(storedUser);
    assert.notEqual(storedUser?.passwordHash, 'StrongPassword123!');
    assert.ok(storedUser?.passwordHash.startsWith('$2'));
  });

  it('AuthService: should reject duplicate email registration', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await assert.rejects(
      async () => {
        await authService.register({
          email: testEmail,
          password: 'AnotherPassword999!',
          fullName: 'Duplicate User',
        });
      },
      /already exists/
    );
  });

  it('AuthService: should authenticate user on valid login and reject bad credentials', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Bad password
    await assert.rejects(
      async () => {
        await authService.login({
          email: testEmail,
          password: 'WrongPassword!',
        });
      },
      /Invalid email address or password/
    );

    // Valid credentials
    const loginRes = await authService.login({
      email: testEmail,
      password: 'StrongPassword123!',
    });

    assert.ok(loginRes.accessToken);
    assert.equal(loginRes.user.email, testEmail);
  });

  it('CompanyService: should onboard company, assign owner role, and provision Main branch', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await companyService.createCompany(testUserId, {
      name: 'Al-Mansoor Trading LLC',
      legalName: 'Al-Mansoor General Trading Limited Liability Company',
      currency: 'AED',
      trn: '100234567800003',
      countryCode: 'AE',
      industryType: 'trading',
      enabledModules: ['accounting', 'inventory'],
      fiscalYearStartMonth: 1,
    });

    assert.ok(res.company.id);
    assert.equal(res.company.name, 'Al-Mansoor Trading LLC');
    assert.equal(res.company.countryCode, 'AE');
    assert.equal(res.company.industryType, 'trading');
    assert.deepEqual(res.company.enabledModules, ['accounting', 'inventory']);

    assert.equal(res.mainBranch.code, 'MAIN');
    assert.equal(res.membership.role, 'owner');

    testCompanyId = res.company.id;

    // Verify database integrity
    const branches = await Branch.find({ companyId: testCompanyId });
    assert.equal(branches.length, 1);
    assert.equal(branches[0].isMain, true);

    const memberships = await CompanyMembership.find({ companyId: testCompanyId });
    assert.equal(memberships.length, 1);
    assert.equal(memberships[0].role, 'owner');
  });

  it('CompanyService: should retrieve company details under strict tenant boundary', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const details = await companyService.getCompanyDetails(testCompanyId, {
      userId: testUserId,
      companyId: testCompanyId,
      role: 'owner',
    });

    assert.equal(details.company.id, testCompanyId);
    assert.equal(details.branches.length, 1);
    assert.equal(details.members.length, 1);
    assert.equal(details.members[0].role, 'owner');
    assert.equal(details.members[0].email, testEmail);
  });

  it('CompanyService: should invite a new accountant and allow acceptance', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const invite = await companyService.inviteUser(testCompanyId, testUserId, {
      email: inviteeEmail,
      role: 'accountant',
    });

    assert.ok(invite.token);
    assert.equal(invite.email, inviteeEmail);
    assert.equal(invite.role, 'accountant');

    // List invitations
    const pending = await companyService.listInvitations(testCompanyId);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].email, inviteeEmail);

    // Accept invitation
    const acceptRes = await companyService.acceptInvitation({
      token: invite.token,
      password: 'InviteePassword456!',
      fullName: 'Amina Al-Nuaimi',
    });

    assert.equal(acceptRes.success, true);
    assert.equal(acceptRes.role, 'accountant');

    // Verify membership was created
    const inviteeUser = await User.findOne({ email: inviteeEmail });
    assert.ok(inviteeUser);

    const inviteeMembership = await CompanyMembership.findOne({
      userId: inviteeUser!._id.toString(),
      companyId: testCompanyId,
    });
    assert.ok(inviteeMembership);
    assert.equal(inviteeMembership!.role, 'accountant');
  });

  it('AuthService: getMe should list all memberships and active companies', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const me = await authService.getMe(testUserId);
    assert.equal(me.user.email, testEmail);
    assert.ok(me.companies.length >= 1);
    const owned = me.companies.find((c) => c.companyId === testCompanyId);
    assert.ok(owned);
    assert.equal(owned?.role, 'owner');
    assert.equal(owned?.countryCode, 'AE');
  });
});
