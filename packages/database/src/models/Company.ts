import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  legalName: string;
  taxId?: string;
  trn?: string;
  currency: string;
  fiscalYearStartMonth: number;
  countryCode: string;
  industryType: 'retail' | 'supermarket' | 'restaurant' | 'trading' | 'manufacturing' | 'services' | 'general';
  enabledModules: string[];
  plan: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  seatLimit: number;
  trialEndsAt?: Date;
  entitlements: string[];
  status: 'active' | 'suspended' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
      maxlength: [100, 'Company name cannot exceed 100 characters'],
      index: true,
    },
    legalName: {
      type: String,
      required: [true, 'Legal name is required'],
      trim: true,
      minlength: [2, 'Legal name must be at least 2 characters'],
      maxlength: [150, 'Legal name cannot exceed 150 characters'],
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    trn: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    currency: {
      type: String,
      required: true,
      default: 'AED',
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    fiscalYearStartMonth: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 12,
    },
    countryCode: {
      type: String,
      required: true,
      default: 'AE',
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 2,
      index: true,
    },
    industryType: {
      type: String,
      enum: ['retail', 'supermarket', 'restaurant', 'trading', 'manufacturing', 'services', 'general'],
      default: 'general',
      index: true,
    },
    enabledModules: {
      type: [String],
      default: ['accounting'],
      index: true,
    },
    plan: {
      type: String,
      default: 'starter',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'suspended', 'cancelled'],
      default: 'trial',
      index: true,
    },
    seatLimit: {
      type: Number,
      default: 3,
      min: 1,
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    entitlements: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'companies',
  }
);

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
