import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId | string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  companyId?: Types.ObjectId;
  outcome: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    outcome: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only immutable log
    collection: 'audit_logs',
  }
);

// Prevent hard-deletes and mutations on audit log collection at Mongoose middleware level
AuditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog records are append-only and cannot be mutated.');
});
AuditLogSchema.pre('updateMany', function () {
  throw new Error('AuditLog records are append-only and cannot be mutated.');
});
AuditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog records are append-only and cannot be mutated.');
});
AuditLogSchema.pre('findOneAndReplace', function () {
  throw new Error('AuditLog records are append-only and cannot be mutated.');
});
AuditLogSchema.pre('deleteOne', function () {
  throw new Error('AuditLog records are append-only and cannot be deleted.');
});
AuditLogSchema.pre('deleteMany', function () {
  throw new Error('AuditLog records are append-only and cannot be deleted.');
});
AuditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('AuditLog records are append-only and cannot be deleted.');
});
AuditLogSchema.pre('save', function () {
  if (!this.isNew) {
    throw new Error('AuditLog records are append-only and cannot be mutated.');
  }
});

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
