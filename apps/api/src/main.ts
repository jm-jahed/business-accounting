/**
 * Business Accounting & Management System
 * NestJS Backend API Bootstrap Entrypoint
 */

import 'reflect-metadata';
import path from 'path';
import dotenv from 'dotenv';

// Robust .env discovery across monorepo root and workspace dirs
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { loadApiConfig } from './config/api.config.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { validateJwtConfig } from './auth/jwt.service.js';
import { dbManager, sanitizeMongoUri } from '@accounting/database';

export function createCorsOptions(apiConfig: ReturnType<typeof loadApiConfig>) {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow non-browser requests (e.g. mobile clients, microservices, health probes)
      if (!origin) return callback(null, true);

      if (apiConfig.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: Origin ${origin} not permitted.`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Company-Id',
      'X-Branch-Id',
      'X-CSRF-Token',
      'x-csrf-token',
      'X-Client-Type',
      'x-client-type',
    ],
  };
}

export async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const apiConfig = loadApiConfig();

  // Validate security configuration on startup (fails fast in production if JWT secrets missing)
  try {
    validateJwtConfig();
  } catch (err: any) {
    logger.error(`Security configuration validation failure: ${err.message}`);
    if (apiConfig.environment === 'production') {
      process.exit(1);
    }
  }

  logger.log('Starting Business Accounting API service...');
  logger.log(`Environment: ${apiConfig.environment} | Port: ${apiConfig.port}`);
  logger.log(`Allowed CORS origins: ${apiConfig.corsOrigins.join(', ')}`);

  // 1. Establish MongoDB connection if URI is configured
  if (process.env.MONGODB_URI) {
    try {
      logger.log(`Connecting to database at ${sanitizeMongoUri(process.env.MONGODB_URI)}...`);
      await dbManager.connect();
      logger.log('Database connection successfully established.');
    } catch (err: any) {
      logger.error(`Database connection failure on startup: ${err.message}`);
      if (apiConfig.environment === 'production') {
        // In production, fatal database failure should prevent ungrounded operation
        process.exit(1);
      }
    }
  } else {
    logger.warn('MONGODB_URI is not set. Service starting in disconnected mode.');
  }

  // 2. Initialize Nest Application
  const app = await NestFactory.create(AppModule, {
    logger: apiConfig.environment === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // 3. Cookie Parser Middleware
  app.use(cookieParser());

  // 4. Global Route Prefix: /api
  app.setGlobalPrefix(apiConfig.apiPrefix);

  // 5. Strict CORS Configuration
  app.enableCors(createCorsOptions(apiConfig));


  // 5. Centralized Error Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 6. Graceful Shutdown
  app.enableShutdownHooks();

  // 7. Start HTTP Server
  await app.listen(apiConfig.port);
  logger.log(`🚀 Business Accounting API ready at http://localhost:${apiConfig.port}/${apiConfig.apiPrefix}`);
  logger.log(`Health endpoint: http://localhost:${apiConfig.port}/${apiConfig.apiPrefix}/health`);

  return app;
}

// Auto-run if executed directly as script
if (require.main === module) {
  bootstrap().catch(err => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
