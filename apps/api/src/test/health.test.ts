import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadApiConfig } from '../config/api.config.js';
import { HealthService } from '../health/health.service.js';
import { createCorsOptions } from '../main.js';

describe('API Foundation & Health Suite', () => {
  it('should load default API configuration with safe defaults', () => {
    const config = loadApiConfig({});
    assert.equal(config.port, 5050);
    assert.equal(config.environment, 'development');
    assert.equal(config.apiPrefix, 'api');
    assert(config.corsOrigins.includes('https://acc.webstudioae.com'), 'CORS must include production domain');
    assert(config.corsOrigins.includes('http://localhost:3000'), 'CORS must include local frontend');
  });

  it('should parse custom PORT and comma-separated CORS_ORIGINS correctly', () => {
    const config = loadApiConfig({
      PORT: '5090',
      NODE_ENV: 'staging',
      CORS_ORIGINS: 'https://staging-acc.webstudioae.com, http://localhost:3001',
    });

    assert.equal(config.port, 5090);
    assert.equal(config.environment, 'staging');
    assert(config.corsOrigins.includes('https://staging-acc.webstudioae.com'));
    assert(config.corsOrigins.includes('http://localhost:3001'));
    // Ensures production domain is still included as safety invariant
    assert(config.corsOrigins.includes('https://acc.webstudioae.com'));
  });

  it('should generate valid HealthService status response with service and database metadata', async () => {
    const service = new HealthService();
    const result = await service.getHealth();

    assert(result, 'Health result must not be null');
    assert(typeof result.status === 'string');
    assert(typeof result.success === 'boolean');
    assert.equal(result.service.name, 'business-accounting-api');
    assert.equal(result.service.version, '1.0.0');
    assert(result.service.uptimeSeconds >= 0);
    assert(result.database, 'Database health section must be present');
    assert(typeof result.database.connected === 'boolean');
    assert(result.timestamp, 'Timestamp must be present');
  });

  it('should configure CORS with credentials, strict origins, and x-client-type in allowedHeaders for preflight', () => {
    const config = loadApiConfig({});
    const cors = createCorsOptions(config);

    assert.equal(cors.credentials, true, 'CORS must enforce credentials: true for cookies');
    assert(cors.methods.includes('OPTIONS'), 'CORS must explicitly allow OPTIONS for preflight');
    assert(cors.allowedHeaders.includes('x-client-type'), 'allowedHeaders must include x-client-type');
    assert(cors.allowedHeaders.includes('X-Client-Type'), 'allowedHeaders must include X-Client-Type');
    assert(cors.allowedHeaders.includes('x-csrf-token'), 'allowedHeaders must include x-csrf-token');
    assert(cors.allowedHeaders.includes('X-CSRF-Token'), 'allowedHeaders must include X-CSRF-Token');

    // Test origin callback for permitted origins
    let allowed: boolean | undefined = false;
    cors.origin('http://localhost:3000', (err, ok) => {
      assert.equal(err, null);
      allowed = ok;
    });
    assert.equal(allowed, true);

    cors.origin('https://acc.webstudioae.com', (err, ok) => {
      assert.equal(err, null);
      allowed = ok;
    });
    assert.equal(allowed, true);

    // Test non-browser client (origin undefined)
    cors.origin(undefined, (err, ok) => {
      assert.equal(err, null);
      allowed = ok;
    });
    assert.equal(allowed, true);

    // Test unauthorized cross-origin client
    cors.origin('https://malicious.attacker.com', (err) => {
      assert.ok(err, 'Unauthorized origin must return an error');
      assert.match(err!.message, /CORS blocked/);
    });
  });
});
