/**
 * Business Accounting & Management System
 * Database Connection Lifecycle & Health Manager
 */

import dns from 'dns';
import mongoose from 'mongoose';
import { DatabaseConfig, loadDatabaseConfig, sanitizeMongoUri, sanitizeErrorMessage, assertTestDatabase } from './config.js';

// Ensure SRV DNS resolution succeeds on systems with restrictive local DNS (e.g. Windows)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setServers is restricted
}

export type DatabaseConnectionState = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';

export interface DatabaseHealthResult {
  readonly status: 'healthy' | 'degraded' | 'unhealthy' | 'disconnected';
  readonly connected: boolean;
  readonly readyState: number;
  readonly databaseName: string | null;
  readonly host: string | null;
  readonly pingMs?: number;
  readonly error?: string;
  readonly timestamp: string;
}

export class DatabaseConnectionError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(`[DatabaseConnection] ${sanitizeErrorMessage(message)}`);
    this.name = 'DatabaseConnectionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private config: DatabaseConfig | null = null;
  private connectingPromise: Promise<mongoose.Connection> | null = null;
  private shutdownRegistered = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Connect to the MongoDB database using loaded configuration.
   * Safe to call multiple times; returns existing connection if active.
   */
  public async connect(overrideConfig?: DatabaseConfig): Promise<mongoose.Connection> {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    this.config = overrideConfig || this.config || loadDatabaseConfig();

    if (this.config.isTestMode || process.env.NODE_ENV === 'test') {
      assertTestDatabase(this.config.dbName);
    }

    const connectOptions: mongoose.ConnectOptions = {
      dbName: this.config.dbName,
      serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
      connectTimeoutMS: this.config.connectTimeoutMS,
      socketTimeoutMS: this.config.socketTimeoutMS,
      maxPoolSize: this.config.maxPoolSize,
      minPoolSize: this.config.minPoolSize,
      autoIndex: !this.config.isProduction,
    };

    this.connectingPromise = (async () => {
      try {
        await mongoose.connect(this.config!.uri, connectOptions);
        this.registerGracefulShutdown();
        return mongoose.connection;
      } catch (err: any) {
        const safeMessage = sanitizeErrorMessage(err?.message || 'Failed to establish MongoDB connection');
        throw new DatabaseConnectionError(safeMessage, err);
      } finally {
        this.connectingPromise = null;
      }
    })();

    return this.connectingPromise;
  }

  /**
   * Gracefully close database connection.
   */
  public async disconnect(force = false): Promise<void> {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      await mongoose.disconnect();
    } catch (err: any) {
      if (!force) {
        throw new DatabaseConnectionError(
          `Error during disconnect: ${sanitizeErrorMessage(err?.message)}`
        );
      }
    }
  }

  /**
   * Reports connection health with safe, sanitized metadata.
   * Never exposes credentials or full connection strings.
   */
  public async getHealth(ping = true): Promise<DatabaseHealthResult> {
    const readyState = mongoose.connection.readyState;
    const timestamp = new Date().toISOString();

    if (readyState !== 1 || !mongoose.connection.db) {
      return {
        status: 'disconnected',
        connected: false,
        readyState,
        databaseName: null,
        host: null,
        timestamp,
      };
    }

    const host = mongoose.connection.host ? sanitizeMongoUri(mongoose.connection.host) : null;
    const databaseName = mongoose.connection.name || this.config?.dbName || null;

    if (!ping) {
      return {
        status: 'healthy',
        connected: true,
        readyState,
        databaseName,
        host,
        timestamp,
      };
    }

    const start = Date.now();
    try {
      await mongoose.connection.db.command({ ping: 1 });
      const pingMs = Date.now() - start;

      return {
        status: pingMs > 1000 ? 'degraded' : 'healthy',
        connected: true,
        readyState,
        databaseName,
        host,
        pingMs,
        timestamp,
      };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        connected: false,
        readyState,
        databaseName,
        host,
        error: sanitizeErrorMessage(err?.message || 'Database ping command failed'),
        timestamp,
      };
    }
  }

  /**
   * Returns current raw connection if initialized.
   */
  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  /**
   * Registers process lifecycle listeners for SIGINT and SIGTERM to guarantee clean closure.
   */
  public registerGracefulShutdown(): void {
    if (this.shutdownRegistered) return;
    this.shutdownRegistered = true;

    const handleExit = async (signal: string) => {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.disconnect();
        }
      } catch {
        // Exit silently on process termination
      } finally {
        if (signal === 'SIGINT' || signal === 'SIGTERM') {
          process.exit(0);
        }
      }
    };

    process.once('SIGINT', () => handleExit('SIGINT'));
    process.once('SIGTERM', () => handleExit('SIGTERM'));
  }
}

export const dbManager = DatabaseManager.getInstance();
