import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IAdminAuditLog extends Document {
  sequenceNumber: number;
  actorId: string;
  actorEmail: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
  prevHash: string;
  hash: string;
  createdAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    sequenceNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    adminRole: {
      type: String,
      required: true,
      trim: true,
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
      required: true,
      trim: true,
      index: true,
    },
    beforeState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    afterState: {
      type: Schema.Types.Mixed,
      default: null,
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
    prevHash: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only
    collection: 'admin_audit_logs',
  }
);

// Prevent hard-deletes and mutations on admin audit log collection
AdminAuditLogSchema.pre('updateOne', function () {
  throw new Error('AdminAuditLog records are append-only and cannot be mutated.');
});
AdminAuditLogSchema.pre('updateMany', function () {
  throw new Error('AdminAuditLog records are append-only and cannot be mutated.');
});
AdminAuditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AdminAuditLog records are append-only and cannot be mutated.');
});
AdminAuditLogSchema.pre('findOneAndReplace', function () {
  throw new Error('AdminAuditLog records are append-only and cannot be mutated.');
});
AdminAuditLogSchema.pre('deleteOne', function () {
  throw new Error('AdminAuditLog records are append-only and cannot be deleted.');
});
AdminAuditLogSchema.pre('deleteMany', function () {
  throw new Error('AdminAuditLog records are append-only and cannot be deleted.');
});
AdminAuditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('AdminAuditLog records are append-only and cannot be deleted.');
});
AdminAuditLogSchema.pre('save', function () {
  if (!this.isNew) {
    throw new Error('AdminAuditLog records are append-only and cannot be mutated.');
  }
});

/**
 * Sanitizes an object by recursively omitting any sensitive credentials
 * (passwords, password hashes, totp secrets, auth tokens, recovery codes).
 */
export function sanitizeAuditState(state: any): any {
  if (!state || typeof state !== 'object') return state;
  if (Array.isArray(state)) return state.map(sanitizeAuditState);

  const sensitiveKeys = new Set([
    'password',
    'passwordHash',
    'encryptedTotpSecret',
    'totpSecret',
    'totpIv',
    'totpAuthTag',
    'recoveryCodeHashes',
    'recoveryCodes',
    'token',
    'accessToken',
    'refreshToken',
    'refreshTokenHash',
    'tempToken',
  ]);

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(state)) {
    if (sensitiveKeys.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      sanitized[key] = sanitizeAuditState(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

/**
 * Computes cryptographic SHA-256 hash for an admin audit log entry.
 */
export function computeAdminAuditHash(params: {
  sequenceNumber: number;
  prevHash: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  afterState?: any;
  timestamp: string | Date;
}): string {
  const ts = params.timestamp instanceof Date ? params.timestamp.toISOString() : params.timestamp;
  const stateStr = params.afterState ? JSON.stringify(params.afterState) : '';
  const payload = `${params.sequenceNumber}|${params.prevHash}|${params.actorId}|${params.action}|${params.targetType}|${params.targetId}|${stateStr}|${ts}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Validates the cryptographic tamper-evident integrity of an array of admin audit logs.
 */
export function verifyAdminAuditChain(logs: IAdminAuditLog[]): {
  isValid: boolean;
  error?: string;
  brokenSequence?: number;
} {
  if (!logs || logs.length === 0) return { isValid: true };

  // Sort ascending by sequence number
  const sorted = [...logs].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    // Check sequence continuity
    if (i > 0 && entry.sequenceNumber !== sorted[i - 1].sequenceNumber + 1) {
      return {
        isValid: false,
        error: `Sequence gap detected between sequence ${sorted[i - 1].sequenceNumber} and ${entry.sequenceNumber}`,
        brokenSequence: entry.sequenceNumber,
      };
    }

    // Check previous hash linkage
    if (i > 0) {
      if (entry.prevHash !== sorted[i - 1].hash) {
        return {
          isValid: false,
          error: `Cryptographic chain link broken at sequence ${entry.sequenceNumber}: prevHash does not match preceding entry hash`,
          brokenSequence: entry.sequenceNumber,
        };
      }
    } else if (entry.sequenceNumber === 1 && entry.prevHash !== 'GENESIS_HASH') {
      return {
        isValid: false,
        error: `Genesis entry at sequence 1 must have prevHash 'GENESIS_HASH'`,
        brokenSequence: entry.sequenceNumber,
      };
    }

    // Check hash recalculation
    const expectedHash = computeAdminAuditHash({
      sequenceNumber: entry.sequenceNumber,
      prevHash: entry.prevHash,
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      afterState: entry.afterState,
      timestamp: entry.createdAt,
    });

    if (entry.hash !== expectedHash) {
      return {
        isValid: false,
        error: `Tampering detected at sequence ${entry.sequenceNumber}: entry hash does not match computed cryptographic hash`,
        brokenSequence: entry.sequenceNumber,
      };
    }
  }

  return { isValid: true };
}

export const AdminAuditLog: Model<IAdminAuditLog> =
  mongoose.models.AdminAuditLog ||
  mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
