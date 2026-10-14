/**
 * Business Accounting & Management System
 * Database Configuration & Sanitization Module
 */

export interface DatabaseConfig {
  readonly uri: string;
  readonly dbName: string;
  readonly serverSelectionTimeoutMS: number;
  readonly connectTimeoutMS: number;
  readonly socketTimeoutMS: number;
  readonly maxPoolSize: number;
  readonly minPoolSize: number;
  readonly isProduction: boolean;
}

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(`[DatabaseConfig] ${message}`);
    this.name = 'DatabaseConfigurationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Sanitizes MongoDB connection URIs by replacing user credentials with asterisks.
 * Never throws; returns a safe fallback if unparseable.
 */
export function sanitizeMongoUri(uri?: string | null): string {
  if (!uri || typeof uri !== 'string') {
    return '[EMPTY_OR_INVALID_URI]';
  }

  try {
    // Attempt standard URL parse
    const parsed = new URL(uri);
    if (parsed.protocol === 'mongodb:' || parsed.protocol === 'mongodb+srv:') {
      const user = parsed.username ? '***' : '';
      const pass = parsed.password ? ':***@' : (user ? '@' : '');
      const authPart = user ? `${user}${pass}` : '';
      return `${parsed.protocol}//${authPart}${parsed.host}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Fall back to regex pattern matching for edge-case URIs
  }

  // Regex fallback: match scheme://user:pass@host/db
  return uri.replace(
    /(mongodb(?:\+srv)?:\/\/)(?:([^:]+)(?::([^@]+))?@)?([^\/\?]+)(\/[^\?]*)?(\?.*)?/i,
    (_match, scheme, user, pass, host, path, query) => {
      const safeUser = user ? '***' : '';
      const safePass = pass ? ':***@' : (safeUser ? '@' : '');
      return `${scheme}${safeUser}${safePass}${host}${path || ''}${query || ''}`;
    }
  );
}

/**
 * Sanitizes generic error messages to ensure no credentials or raw connection strings leak.
 */
export function sanitizeErrorMessage(message?: string | null): string {
  if (!message || typeof message !== 'string') return '';
  return message.replace(
    /(mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@)([^\/\s\?]+)/gi,
    'mongodb+srv://***:***@$2'
  );
}

/**
 * Loads, validates, and freezes database configuration from environment variables.
 * Throws DatabaseConfigurationError if required variables are missing or malformed.
 */
export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const rawUri = env.MONGODB_URI?.trim();

  if (!rawUri) {
    throw new DatabaseConfigurationError(
      'MONGODB_URI environment variable is required but is missing or empty.'
    );
  }

  if (!rawUri.startsWith('mongodb://') && !rawUri.startsWith('mongodb+srv://')) {
    throw new DatabaseConfigurationError(
      'MONGODB_URI must start with "mongodb://" or "mongodb+srv://".'
    );
  }

  const dbName = env.DB_NAME?.trim() || 'business_accounting';

  const parsePositiveInt = (val: string | undefined, fallback: number, name: string): number => {
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new DatabaseConfigurationError(`Invalid ${name} value "${val}". Must be a positive integer.`);
    }
    return parsed;
  };

  const isProduction = env.NODE_ENV === 'production';
  const serverSelectionTimeoutMS = parsePositiveInt(env.DB_SERVER_SELECTION_TIMEOUT_MS, 5000, 'DB_SERVER_SELECTION_TIMEOUT_MS');
  const connectTimeoutMS = parsePositiveInt(env.DB_CONNECT_TIMEOUT_MS, 10000, 'DB_CONNECT_TIMEOUT_MS');
  const socketTimeoutMS = parsePositiveInt(env.DB_SOCKET_TIMEOUT_MS, 45000, 'DB_SOCKET_TIMEOUT_MS');
  const maxPoolSize = parsePositiveInt(env.DB_MAX_POOL_SIZE, isProduction ? 50 : 10, 'DB_MAX_POOL_SIZE');
  const minPoolSize = parsePositiveInt(env.DB_MIN_POOL_SIZE, isProduction ? 5 : 1, 'DB_MIN_POOL_SIZE');

  return Object.freeze({
    uri: rawUri,
    dbName,
    serverSelectionTimeoutMS,
    connectTimeoutMS,
    socketTimeoutMS,
    maxPoolSize,
    minPoolSize,
    isProduction,
  });
}
