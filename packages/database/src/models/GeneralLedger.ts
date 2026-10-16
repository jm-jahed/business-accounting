import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { VoucherType, VOUCHER_TYPES } from '@accounting/contracts';

export interface IGeneralLedger extends Document {
  companyId: Types.ObjectId;
  branchId?: Types.ObjectId | null;
  journalEntryId: Types.ObjectId;
  entryNumber: string;
  voucherType: VoucherType;
  entryDate: Date;
  accountId: Types.ObjectId;
  accountCode: string;
  accountName: string;
  accountType?: string | null;
  debit: Types.Decimal128;
  credit: Types.Decimal128;
  description: string;
  reference?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const GeneralLedgerSchema = new Schema<IGeneralLedger>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'General ledger line must belong to a Company'],
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      required: [true, 'General ledger line must link to a Journal Entry'],
      index: true,
    },
    entryNumber: {
      type: String,
      required: [true, 'Entry number is required'],
      trim: true,
    },
    voucherType: {
      type: String,
      enum: VOUCHER_TYPES,
      default: 'JOURNAL',
      required: true,
      index: true,
    },
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account ID is required'],
      index: true,
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
    accountType: {
      type: String,
      trim: true,
      default: null,
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
      required: [true, 'Description is required'],
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'general_ledger',
  }
);

// High-performance compound indexes for Ledger inquiries and Statement generation
GeneralLedgerSchema.index({ companyId: 1, accountId: 1, entryDate: 1 });
GeneralLedgerSchema.index({ companyId: 1, entryDate: -1 });
GeneralLedgerSchema.index({ companyId: 1, journalEntryId: 1 });

export const GeneralLedger: Model<IGeneralLedger> =
  mongoose.models.GeneralLedger ||
  mongoose.model<IGeneralLedger>('GeneralLedger', GeneralLedgerSchema);
