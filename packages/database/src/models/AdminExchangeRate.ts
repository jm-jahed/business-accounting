import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAdminExchangeRate extends Document {
  fromCurrency: string;
  toCurrency: string;
  rate: Types.Decimal128;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminExchangeRateSchema = new Schema<IAdminExchangeRate>(
  {
    fromCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      index: true,
    },
    toCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      index: true,
    },
    rate: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'admin_exchange_rates',
  }
);

AdminExchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

export const AdminExchangeRate: Model<IAdminExchangeRate> =
  mongoose.models.AdminExchangeRate ||
  mongoose.model<IAdminExchangeRate>('AdminExchangeRate', AdminExchangeRateSchema);
