import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { BillingCycle, BILLING_CYCLES } from '@accounting/contracts';

export interface IPlanPrice extends Document {
  planId: Types.ObjectId;
  planCode: string;
  region: string;
  currency: string;
  billingCycle: BillingCycle;
  amount: Types.Decimal128;
  extraUserAmount: Types.Decimal128;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanPriceSchema = new Schema<IPlanPrice>(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan ID is required'],
      index: true,
    },
    planCode: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      index: true,
    },
    billingCycle: {
      type: String,
      enum: BILLING_CYCLES,
      required: true,
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Price amount is required'],
    },
    extraUserAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Extra user price amount is required'],
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
      index: true,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'plan_prices',
  }
);

// Prevent hard deletes - preserves historical grandfathered price records
PlanPriceSchema.pre('deleteOne', function () {
  throw new Error('Hard deleting plan prices is prohibited to preserve historical contracts.');
});
PlanPriceSchema.pre('deleteMany', function () {
  throw new Error('Hard deleting plan prices is prohibited to preserve historical contracts.');
});
PlanPriceSchema.pre('findOneAndDelete', function () {
  throw new Error('Hard deleting plan prices is prohibited to preserve historical contracts.');
});

export const PlanPrice: Model<IPlanPrice> =
  mongoose.models.PlanPrice || mongoose.model<IPlanPrice>('PlanPrice', PlanPriceSchema);
