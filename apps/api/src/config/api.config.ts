/**
 * Business Accounting & Management System
 * API Application Configuration
 */

export interface ApiConfig {
  readonly port: number;
  readonly environment: string;
  readonly corsOrigins: readonly string[];
  readonly apiPrefix: string;
}

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = parseInt(env.PORT || '5050', 10);
  const environment = env.NODE_ENV || 'development';
  
  const rawCors =
    env.CORS_ORIGINS ||
    'https://acc.webstudioae.com,https://admin.acc.webstudioae.com,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001';
  const corsOrigins = rawCors
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  // Guarantee production web and admin domains are always explicitly allowed
  if (!corsOrigins.includes('https://acc.webstudioae.com')) {
    corsOrigins.unshift('https://acc.webstudioae.com');
  }
  if (!corsOrigins.includes('https://admin.acc.webstudioae.com')) {
    corsOrigins.unshift('https://admin.acc.webstudioae.com');
  }

  return Object.freeze({
    port: isNaN(port) ? 5050 : port,
    environment,
    corsOrigins: Object.freeze(corsOrigins),
    apiPrefix: 'api',
  });
}
