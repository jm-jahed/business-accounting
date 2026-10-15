import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  googleId?: string;
  authProvider: 'local' | 'google' | 'both';
  status: 'active' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format'],
    },
    passwordHash: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'both'],
      default: 'local',
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
