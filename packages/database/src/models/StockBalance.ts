import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IStockBalance extends Document {
  companyId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  itemId: Types.ObjectId;
  binId?: Types.ObjectId | null;
  onHandQty: Types.Decimal128;
  reservedQty: Types.Decimal128;
  availableQty: Types.Decimal128;
  onOrderQty: Types.Decimal128;
  averageUnitCost: Types.Decimal128;
  totalValuation: Types.Decimal128;
  lastMovementAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockBalanceSchema = new Schema<IStockBalance>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    binId: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
      index: true,
    },
    onHandQty: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    reservedQty: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    availableQty: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    onOrderQty: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    averageUnitCost: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    totalValuation: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    lastMovementAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_stock_balances',
  }
);

StockBalanceSchema.index(
  { companyId: 1, warehouseId: 1, itemId: 1, binId: 1 },
  { unique: true }
);

export const StockBalance: Model<IStockBalance> =
  mongoose.models.StockBalance ||
  mongoose.model<IStockBalance>('StockBalance', StockBalanceSchema);
