import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IUserSession extends Document {
  userId: Types.ObjectId | string;
  sessionFamily: string;
  refreshTokenHash: string;
  previousTokenHash?: string;
  rotatedAt?: Date;
  ipAddress: string;
  userAgent: string;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    sessionFamily: {
      type: String,
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    previousTokenHash: {
      type: String,
      default: null,
    },
    rotatedAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },

  {
    timestamps: true,
    collection: 'user_sessions',
  }
);

// TTL index to automatically prune expired sessions after 30 days
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const UserSession: Model<IUserSession> =
  mongoose.models.UserSession || mongoose.model<IUserSession>('UserSession', UserSessionSchema);
