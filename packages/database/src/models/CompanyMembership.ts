import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CompanyMemberRole = 'owner' | 'admin' | 'accountant' | 'auditor' | 'viewer';

export interface ICompanyMembership extends Document {
  userId: string;
  companyId: Types.ObjectId;
  role: CompanyMemberRole;
  seatType: 'full' | 'read_only';
  branchAccess: string[] | 'all';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CompanyMembershipSchema = new Schema<ICompanyMembership>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      trim: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'accountant', 'auditor', 'viewer'],
      default: 'viewer',
      required: true,
      index: true,
    },
    seatType: {
      type: String,
      enum: ['full', 'read_only'],
      default: 'full',
      index: true,
    },
    branchAccess: {
      type: Schema.Types.Mixed,
      default: 'all',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'company_memberships',
  }
);

// One active membership record per user per company
CompanyMembershipSchema.index({ userId: 1, companyId: 1 }, { unique: true });

export const CompanyMembership: Model<ICompanyMembership> =
  mongoose.models.CompanyMembership ||
  mongoose.model<ICompanyMembership>('CompanyMembership', CompanyMembershipSchema);
