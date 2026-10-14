/**
 * Business Accounting & Management System
 * Health Monitoring Service
 */

import { Injectable } from '@nestjs/common';
import { dbManager, DatabaseHealthResult } from '@accounting/database';

export interface ServiceHealthStatus {
  readonly success: boolean;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly service: {
    readonly name: string;
    readonly version: string;
    readonly environment: string;
    readonly uptimeSeconds: number;
  };
  readonly database: DatabaseHealthResult;
  readonly timestamp: string;
}

@Injectable()
export class HealthService {
  async getHealth(): Promise<ServiceHealthStatus> {
    const dbHealth = await dbManager.getHealth(true);
    const uptimeSeconds = Math.round(process.uptime() * 100) / 100;
    const environment = process.env.NODE_ENV || 'development';

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' =
      dbHealth.status === 'healthy'
        ? 'healthy'
        : dbHealth.status === 'degraded'
        ? 'degraded'
        : 'unhealthy';

    return {
      success: overallStatus !== 'unhealthy',
      status: overallStatus,
      service: {
        name: 'business-accounting-api',
        version: '1.0.0',
        environment,
        uptimeSeconds,
      },
      database: dbHealth,
      timestamp: new Date().toISOString(),
    };
  }
}
