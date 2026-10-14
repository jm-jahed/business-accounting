import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBranch extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  address?: string;
  isMain: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Branch must be linked to a valid Company'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    isMain: {
      type: Boolean,
      default: false,
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
    collection: 'branches',
  }
);

// Unique branch code per company
BranchSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Branch: Model<IBranch> =
  mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
