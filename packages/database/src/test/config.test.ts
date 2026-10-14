import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadDatabaseConfig,
  DatabaseConfigurationError,
  sanitizeMongoUri,
  sanitizeErrorMessage,
} from '../config.js';

describe('Database Configuration & Sanitization Suite', () => {
  it('should throw DatabaseConfigurationError if MONGODB_URI is missing', () => {
    assert.throws(
      () => loadDatabaseConfig({}),
      (err: any) => {
        assert(err instanceof DatabaseConfigurationError);
        assert.match(err.message, /MONGODB_URI environment variable is required/);
        return true;
      }
    );
  });

  it('should throw DatabaseConfigurationError if MONGODB_URI is empty whitespace', () => {
    assert.throws(
      () => loadDatabaseConfig({ MONGODB_URI: '   ' }),
      (err: any) => {
        assert(err instanceof DatabaseConfigurationError);
        assert.match(err.message, /missing or empty/);
        return true;
      }
    );
  });

  it('should throw DatabaseConfigurationError if protocol is invalid', () => {
    assert.throws(
      () => loadDatabaseConfig({ MONGODB_URI: 'postgres://user:pass@localhost:5432/db' }),
      (err: any) => {
        assert(err instanceof DatabaseConfigurationError);
        assert.match(err.message, /must start with "mongodb:\/\/" or "mongodb\+srv:\/\/"/);
        return true;
      }
    );
  });

  it('should load valid config and default dbName to business_accounting', () => {
    const config = loadDatabaseConfig({
      MONGODB_URI: 'mongodb://127.0.0.1:27017',
    });

    assert.equal(config.uri, 'mongodb://127.0.0.1:27017');
    assert.equal(config.dbName, 'business_accounting');
    assert.equal(config.serverSelectionTimeoutMS, 5000);
    assert.equal(config.isProduction, false);
  });

  it('should respect custom DB_NAME and production environment overrides', () => {
    const config = loadDatabaseConfig({
      MONGODB_URI: 'mongodb+srv://cluster0.test.net',
      DB_NAME: 'custom_accounting_db',
      NODE_ENV: 'production',
      DB_MAX_POOL_SIZE: '100',
    });

    assert.equal(config.dbName, 'custom_accounting_db');
    assert.equal(config.isProduction, true);
    assert.equal(config.maxPoolSize, 100);
  });

  it('should sanitize credentials from mongodb+srv URI', () => {
    const raw = 'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.3l32jb8.mongodb.net/business_accounting?appName=Cluster0';
    const sanitized = sanitizeMongoUri(raw);

    assert(!sanitized.includes('SuperSecretPassword123'), 'Sanitized URI must not contain raw password');
    assert(!sanitized.includes('admin_user'), 'Sanitized URI must not contain username');
    assert(sanitized.includes('***:***@cluster0.3l32jb8.mongodb.net/business_accounting'), 'Sanitized URI must preserve host and path');
  });

  it('should sanitize credentials from standard mongodb URI', () => {
    const raw = 'mongodb://app_worker:SecretPass999@10.0.0.5:27017/accounting?replicaSet=rs0';
    const sanitized = sanitizeMongoUri(raw);

    assert(!sanitized.includes('SecretPass999'), 'Sanitized URI must not contain raw password');
    assert(sanitized.includes('***:***@10.0.0.5:27017/accounting'), 'Sanitized URI must preserve host and port');
  });

  it('should sanitize error message strings containing credentials', () => {
    const rawError = 'Connection failed to mongodb+srv://business-acc:SecretPass123@cluster0.3l32jb8.mongodb.net: server selection timed out';
    const sanitized = sanitizeErrorMessage(rawError);

    assert(!sanitized.includes('SecretPass123'), 'Sanitized error message must not contain password');
    assert(sanitized.includes('mongodb+srv://***:***@cluster0.3l32jb8.mongodb.net'), 'Sanitized error must keep host reference');
  });
});
