import crypto from 'crypto';

export interface AdminConfig {
  readonly accessSecret: string;
  readonly refreshSecret: string;
  readonly accessExpiry: string;
  readonly refreshExpiry: string;
  readonly totpEncryptionKey: Buffer;
  readonly corsOrigins: string[];
  readonly cookieAccessName: string;
  readonly cookieRefreshName: string;
}

export function loadAdminConfig(env: NodeJS.ProcessEnv = process.env): AdminConfig {
  const isProduction = env.NODE_ENV === 'production';
  const accessSecret = env.ADMIN_JWT_ACCESS_SECRET?.trim() || '';
  const refreshSecret = env.ADMIN_JWT_REFRESH_SECRET?.trim() || '';
  const totpRawKey = env.ADMIN_TOTP_ENCRYPTION_KEY?.trim() || '';

  if (isProduction) {
    if (!accessSecret || accessSecret.length < 32) {
      throw new Error('[AdminSecurity] In production, ADMIN_JWT_ACCESS_SECRET must be at least 32 characters.');
    }
    if (!refreshSecret || refreshSecret.length < 32) {
      throw new Error('[AdminSecurity] In production, ADMIN_JWT_REFRESH_SECRET must be at least 32 characters.');
    }
    if (accessSecret === refreshSecret) {
      throw new Error('[AdminSecurity] ADMIN_JWT_ACCESS_SECRET and ADMIN_JWT_REFRESH_SECRET must be distinct.');
    }
    if (!totpRawKey || totpRawKey.length < 32) {
      throw new Error('[AdminSecurity] ADMIN_TOTP_ENCRYPTION_KEY must be at least 32 characters for AES-256-GCM.');
    }
  }

  const safeAccessSecret =
    accessSecret.length >= 16
      ? accessSecret
      : 'dev-admin-insecure-access-secret-minimum-32-chars-long!';
  const safeRefreshSecret =
    refreshSecret.length >= 16
      ? refreshSecret
      : 'dev-admin-insecure-refresh-secret-minimum-32-chars-long!';

  // Derive exact 32-byte key for AES-256-GCM
  const safeTotpKeyStr =
    totpRawKey.length >= 16
      ? totpRawKey
      : 'dev-admin-totp-encryption-key-minimum-32-chars-secure!';
  const totpEncryptionKey = crypto.createHash('sha256').update(safeTotpKeyStr).digest();

  const rawCors = env.ADMIN_CORS_ORIGINS || 'http://localhost:3001,http://127.0.0.1:3001,https://admin.acc.webstudioae.com';
  const corsOrigins = rawCors
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  return {
    accessSecret: safeAccessSecret,
    refreshSecret: safeRefreshSecret,
    accessExpiry: env.ADMIN_JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: env.ADMIN_JWT_REFRESH_EXPIRY || '7d',
    totpEncryptionKey,
    corsOrigins,
    cookieAccessName: 'sb_admin_token',
    cookieRefreshName: 'sb_admin_refresh_token',
  };
}
