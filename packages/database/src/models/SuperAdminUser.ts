import mongoose, { Schema, Document, Model } from 'mongoose';
import { AdminRole, ADMIN_ROLES } from '@accounting/contracts';

export interface ISuperAdminUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  encryptedTotpSecret?: string;
  totpIv?: string;
  totpAuthTag?: string;
  isTotpEnabled: boolean;
  recoveryCodeHashes: string[];
  lastUsedTimeStep: number;
  status: 'active' | 'suspended';
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: Date | null;
  lastLoginAt?: Date | null;
  sessionFamily?: string;
  refreshTokenHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SuperAdminUserSchema = new Schema<ISuperAdminUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ADMIN_ROLES,
      default: 'SUPPORT',
      required: true,
      index: true,
    },
    encryptedTotpSecret: {
      type: String,
      default: '',
    },
    totpIv: {
      type: String,
      default: '',
    },
    totpAuthTag: {
      type: String,
      default: '',
    },
    isTotpEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    recoveryCodeHashes: {
      type: [String],
      default: [],
    },
    lastUsedTimeStep: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    sessionFamily: {
      type: String,
      default: '',
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'super_admin_users',
  }
);

export const SuperAdminUser: Model<ISuperAdminUser> =
  mongoose.models.SuperAdminUser ||
  mongoose.model<ISuperAdminUser>('SuperAdminUser', SuperAdminUserSchema);
