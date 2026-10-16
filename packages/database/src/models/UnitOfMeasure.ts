import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { UomCategory } from '@accounting/contracts';

export interface IUnitOfMeasure extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  category: UomCategory;
  baseUnitId?: Types.ObjectId | null;
  conversionRatio: Types.Decimal128;
  isBaseUnit: boolean;
  precision: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UnitOfMeasureSchema = new Schema<IUnitOfMeasure>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'UoM must belong to a company'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'UoM code is required'],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 12,
    },
    name: {
      type: String,
      required: [true, 'UoM name is required'],
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    category: {
      type: String,
      enum: ['UNIT', 'WEIGHT', 'VOLUME', 'LENGTH', 'AREA', 'TIME', 'PACKAGING'],
      default: 'UNIT',
      index: true,
    },
    baseUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'UnitOfMeasure',
      default: null,
    },
    conversionRatio: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('1.0000'),
    },
    isBaseUnit: {
      type: Boolean,
      default: true,
      index: true,
    },
    precision: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_units_of_measure',
  }
);

// Compound unique index: UoM code must be unique per company
UnitOfMeasureSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const UnitOfMeasure: Model<IUnitOfMeasure> =
  mongoose.models.UnitOfMeasure ||
  mongoose.model<IUnitOfMeasure>('UnitOfMeasure', UnitOfMeasureSchema);
