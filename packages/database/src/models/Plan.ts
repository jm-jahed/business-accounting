import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlanLimits {
  users: number;
  companies: number;
  invoicesPerMonth: number;
  storageMb: number;
}

export interface IPlan extends Document {
  code: string;
  nameEn: string;
  nameBn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionBn?: string;
  descriptionAr?: string;
  isPublic: boolean;
  isActive: boolean;
  modules: string[];
  limits: IPlanLimits;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    nameEn: {
      type: String,
      required: [true, 'English name is required'],
      trim: true,
      maxlength: 100,
    },
    nameBn: {
      type: String,
      required: [true, 'Bengali name is required'],
      trim: true,
      maxlength: 100,
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    descriptionEn: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    descriptionBn: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    descriptionAr: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    modules: {
      type: [String],
      default: ['accounting'],
    },
    limits: {
      users: { type: Number, required: true, default: 3, min: 1 },
      companies: { type: Number, required: true, default: 1, min: 1 },
      invoicesPerMonth: { type: Number, required: true, default: -1 },
      storageMb: { type: Number, required: true, default: 512, min: 100 },
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'plans',
  }
);

// Prevent hard deletes
PlanSchema.pre('deleteOne', function () {
  throw new Error('Hard deleting plans is prohibited. Deactivate the plan instead.');
});
PlanSchema.pre('deleteMany', function () {
  throw new Error('Hard deleting plans is prohibited. Deactivate the plan instead.');
});
PlanSchema.pre('findOneAndDelete', function () {
  throw new Error('Hard deleting plans is prohibited. Deactivate the plan instead.');
});

export const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
