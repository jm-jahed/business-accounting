import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dbManager, DatabaseManager, DatabaseConnectionError } from '../connection.js';

describe('Database Connection Manager Suite', () => {
  it('should return a singleton instance of DatabaseManager', () => {
    const instanceA = DatabaseManager.getInstance();
    const instanceB = dbManager;
    assert.equal(instanceA, instanceB);
  });

  it('should report disconnected health status when not connected', async () => {
    const health = await dbManager.getHealth(false);
    assert.equal(health.connected, false);
    assert.equal(health.status, 'disconnected');
    assert.equal(health.databaseName, null);
    assert.equal(health.host, null);
    assert(health.timestamp, 'Timestamp must be present');
  });

  it('should fail safely and sanitize errors when connecting with unreachable URI', async () => {
    const unreachableConfig = {
      uri: 'mongodb://nonexistent_user:superSecretPassword987@127.0.0.1:27099/unreachable_test',
      dbName: 'unreachable_test',
      serverSelectionTimeoutMS: 500,
      connectTimeoutMS: 500,
      socketTimeoutMS: 500,
      maxPoolSize: 2,
      minPoolSize: 1,
      isProduction: false,
      isTestMode: true,
    };

    try {
      await dbManager.connect(unreachableConfig);
      assert.fail('Expected connection to fail for unreachable port');
    } catch (err: any) {
      assert(err instanceof DatabaseConnectionError);
      assert(!err.message.includes('superSecretPassword987'), 'Password must never leak in connection error');
    } finally {
      await dbManager.disconnect(true);
    }
  });
});
