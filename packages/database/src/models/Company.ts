import mongoose, { Schema, Document, Model } from 'mongoose';
import { normalizeCompanySlug } from '@accounting/contracts';

export interface ICompany extends Document {
  name: string;
  slug: string;
  legalName: string;
  taxId?: string;
  trn?: string;
  currency: string;
  fiscalYearStartMonth: number;
  countryCode: string;
  country?: string;
  region?: string;
  dataRegion?: string;
  vatNumber?: string;
  industryType: 'retail' | 'supermarket' | 'restaurant' | 'trading' | 'manufacturing' | 'services' | 'general';
  businessTypes?: string[];
  enabledModules: string[];
  plan: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  seatLimit: number;
  allocatedFullSeats: number;
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
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Store slug must be at least 3 characters'],
      maxlength: [63, 'Store slug cannot exceed 63 characters'],
      index: true,
      default: function (this: any) {
        return this.name ? normalizeCompanySlug(this.name) : undefined;
      },
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
    country: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    region: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    dataRegion: {
      type: String,
      trim: true,
      default: 'GULF',
      index: true,
    },
    vatNumber: {
      type: String,
      trim: true,
      default: '',
    },
    industryType: {
      type: String,
      enum: ['retail', 'supermarket', 'restaurant', 'trading', 'manufacturing', 'services', 'general'],
      default: 'general',
      index: true,
    },
    businessTypes: {
      type: [String],
      default: ['retail'],
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
    allocatedFullSeats: {
      type: Number,
      default: 1,
      min: 0,
      index: true,
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

CompanySchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = normalizeCompanySlug(this.name);
  }
  next();
});

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
