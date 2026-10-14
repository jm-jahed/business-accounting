import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CompanyMemberRole } from './CompanyMembership.js';

export interface ICompanyInvitation extends Document {
  companyId: Types.ObjectId;
  email: string;
  role: CompanyMemberRole;
  token: string;
  invitedBy: Types.ObjectId | string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyInvitationSchema = new Schema<ICompanyInvitation>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'accountant', 'auditor', 'viewer'],
      required: true,
      default: 'accountant',
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'company_invitations',
  }
);

CompanyInvitationSchema.index({ companyId: 1, email: 1, status: 1 });

export const CompanyInvitation: Model<ICompanyInvitation> =
  mongoose.models.CompanyInvitation ||
  mongoose.model<ICompanyInvitation>('CompanyInvitation', CompanyInvitationSchema);
