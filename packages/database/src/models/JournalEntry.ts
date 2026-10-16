import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { VoucherType, VoucherStatus, VOUCHER_TYPES, VOUCHER_STATUSES } from '@accounting/contracts';
import { invalidateCompanyDashboardCache } from '../services/dashboard-cache.js';

export interface IJournalLine {
  accountId: Types.ObjectId;
  accountCode: string;
  accountName: string;
  debit: Types.Decimal128;
  credit: Types.Decimal128;
  description?: string | null;
}

export interface IJournalEntry extends Document {
  companyId: Types.ObjectId;
  branchId?: Types.ObjectId | null;
  entryNumber: string;
  voucherType: VoucherType;
  status: VoucherStatus;
  entryDate: Date;
  reference?: string | null;
  description: string;
  lines: IJournalLine[];
  totalDebit: Types.Decimal128;
  totalCredit: Types.Decimal128;
  postedAt?: Date | null;
  postedBy?: Types.ObjectId | null;
  reversalOfId?: Types.ObjectId | null;
  reversedById?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const JournalLineSchema = new Schema<IJournalLine>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account ID is required'],
    },
    accountCode: {
      type: String,
      required: [true, 'Account code is required'],
      trim: true,
    },
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    debit: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    credit: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Journal entry must belong to a Company'],
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    entryNumber: {
      type: String,
      required: [true, 'Entry number is required'],
      trim: true,
      uppercase: true,
    },
    voucherType: {
      type: String,
      enum: VOUCHER_TYPES,
      default: 'JOURNAL',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: VOUCHER_STATUSES,
      default: 'POSTED',
      required: true,
      index: true,
    },
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
      index: true,
    },
    reference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    lines: {
      type: [JournalLineSchema],
      required: [true, 'Lines are required'],
      validate: {
        validator: (v: IJournalLine[]) => Array.isArray(v) && v.length >= 2,
        message: 'A journal entry must contain at least 2 lines',
      },
    },
    totalDebit: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    totalCredit: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    postedAt: {
      type: Date,
      default: null,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reversalOfId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      default: null,
    },
    reversedById: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'journal_entries',
  }
);

// Compound unique index: Voucher / Entry Number must be unique per Company
JournalEntrySchema.index({ companyId: 1, entryNumber: 1 }, { unique: true });

// Compound query indexes for efficient tenant searches and date filtering
JournalEntrySchema.index({ companyId: 1, entryDate: -1, status: 1 });
JournalEntrySchema.index({ companyId: 1, voucherType: 1, entryDate: -1 });

// Cache Invalidation Hooks on Journal mutations (post, void, reverse)
JournalEntrySchema.post('save', function (doc: any) {
  if (doc?.companyId) {
    invalidateCompanyDashboardCache(doc.companyId.toString());
  }
});

JournalEntrySchema.post(['updateOne', 'updateMany', 'findOneAndUpdate'], function (this: any) {
  const filter = this.getFilter ? this.getFilter() : null;
  if (filter?.companyId) {
    invalidateCompanyDashboardCache(filter.companyId.toString());
  }
});

export const JournalEntry: Model<IJournalEntry> =
  mongoose.models.JournalEntry ||
  mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
