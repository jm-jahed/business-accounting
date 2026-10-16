import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  BillingCycle,
  BILLING_CYCLES,
  SubscriptionLifecycleStatus,
  SUBSCRIPTION_LIFECYCLE_STATUSES,
} from '@accounting/contracts';

export interface ISubscription extends Document {
  companyId: Types.ObjectId;
  planId: Types.ObjectId;
  planCode: string;
  planPriceId?: Types.ObjectId;
  billingCycle: BillingCycle;
  currency: string;
  amount: Types.Decimal128;
  seats: number;
  status: SubscriptionLifecycleStatus;
  trialEndsAt?: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  graceEndsAt?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      unique: true,
      index: true,
    },
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
    planPriceId: {
      type: Schema.Types.ObjectId,
      ref: 'PlanPrice',
      default: null,
    },
    billingCycle: {
      type: String,
      enum: BILLING_CYCLES,
      default: 'MONTHLY',
      required: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      default: 'AED',
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    seats: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_LIFECYCLE_STATUSES,
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    graceEndsAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'subscriptions',
  }
);

// Prevent hard deletes on subscriptions to guarantee auditability and non-destructive retention
SubscriptionSchema.pre('deleteOne', function () {
  throw new Error('Hard deleting subscriptions is prohibited. Transition to CANCELLED instead.');
});
SubscriptionSchema.pre('deleteMany', function () {
  throw new Error('Hard deleting subscriptions is prohibited. Transition to CANCELLED instead.');
});
SubscriptionSchema.pre('findOneAndDelete', function () {
  throw new Error('Hard deleting subscriptions is prohibited. Transition to CANCELLED instead.');
});

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
