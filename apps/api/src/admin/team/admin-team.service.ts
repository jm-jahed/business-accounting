import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { SuperAdminUser } from '@accounting/database';
import { CreateAdminUserInput, UpdateAdminUserInput } from '@accounting/contracts';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';

@Injectable()
export class AdminTeamService {
  constructor(private readonly auditService: AdminAuditService) {}

  public async listTeam() {
    const users = await SuperAdminUser.find().sort({ createdAt: -1 }).lean();
    return users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      isTotpEnabled: u.isTotpEnabled,
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  public async createAdmin(
    input: CreateAdminUserInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    if (admin.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only a SUPER_ADMIN can create new admin team members.');
    }

    if (input.password.length < 12) {
      throw new BadRequestException('Admin password must be at least 12 characters long.');
    }

    const email = input.email.trim().toLowerCase();
    const existing = await SuperAdminUser.findOne({ email });
    if (existing) {
      throw new ConflictException(`Admin user with email "${email}" already exists.`);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const newAdmin = new SuperAdminUser({
      email,
      name: input.name.trim(),
      passwordHash,
      role: input.role,
      status: 'active',
      isTotpEnabled: false,
      mustChangePassword: true, // Mandatory first-login password change
      failedLoginAttempts: 0,
      recoveryCodeHashes: [],
    });

    const saved = await newAdmin.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.team.create_member',
      targetType: 'AdminUser',
      targetId: saved._id.toString(),
      afterState: { email: saved.email, name: saved.name, role: saved.role },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      id: saved._id.toString(),
      email: saved.email,
      name: saved.name,
      role: saved.role,
      status: saved.status,
      mustChangePassword: saved.mustChangePassword,
    };
  }

  public async updateAdmin(
    targetId: string,
    input: UpdateAdminUserInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const target = await SuperAdminUser.findById(targetId);
    if (!target) throw new NotFoundException('Admin user not found.');

    const beforeState = target.toObject();

    // Prevent user from changing their own role
    if (admin.sub === targetId && input.role && input.role !== target.role) {
      throw new BadRequestException('You cannot change your own admin role.');
    }

    // Protect last SUPER_ADMIN from demotion
    if (target.role === 'SUPER_ADMIN' && input.role && input.role !== 'SUPER_ADMIN') {
      const superAdminCount = await SuperAdminUser.countDocuments({
        role: 'SUPER_ADMIN',
        status: 'active',
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot demote the last remaining active SUPER_ADMIN.');
      }
    }

    // Protect last SUPER_ADMIN from suspension
    if (target.role === 'SUPER_ADMIN' && input.status === 'suspended') {
      const superAdminCount = await SuperAdminUser.countDocuments({
        role: 'SUPER_ADMIN',
        status: 'active',
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot suspend the last remaining active SUPER_ADMIN.');
      }
    }

    if (input.name) target.name = input.name.trim();
    if (input.role) target.role = input.role;
    if (input.status) target.status = input.status;

    const saved = await target.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.team.update_member',
      targetType: 'AdminUser',
      targetId: saved._id.toString(),
      beforeState,
      afterState: { name: saved.name, role: saved.role, status: saved.status },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      id: saved._id.toString(),
      email: saved.email,
      name: saved.name,
      role: saved.role,
      status: saved.status,
    };
  }
}
