import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { AccountType, NormalBalance, getNormalBalanceForAccountType } from '@accounting/contracts';

export interface IAccount extends Document {
  companyId: Types.ObjectId;
  branchId?: Types.ObjectId | null;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId?: Types.ObjectId | null;
  currency?: string | null;
  isActive: boolean;
  isSystem: boolean;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Account must belong to a Company'],
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Account code is required'],
      trim: true,
      minlength: 1,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
      required: [true, 'Account type is required'],
      index: true,
    },
    normalBalance: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true,
      default: function (this: any) {
        return this.type ? getNormalBalanceForAccountType(this.type as AccountType) : undefined;
      },
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
      index: true,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'chart_of_accounts',
  }
);

// Pre-save hook: automatically sync normalBalance based on account type
AccountSchema.pre('validate', function (next) {
  if (this.type && !this.normalBalance) {
    this.normalBalance = getNormalBalanceForAccountType(this.type as AccountType);
  }
  next();
});

// Compound unique index: Account code must be unique within a Company
AccountSchema.index({ companyId: 1, code: 1 }, { unique: true });

// Compound query index for fast balance sheet and income statement queries
AccountSchema.index({ companyId: 1, type: 1, isActive: 1 });

export const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
