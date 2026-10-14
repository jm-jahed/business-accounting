/**
 * Business Accounting & Management System
 * Health Monitoring Controller
 */

import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async checkHealth(@Res() res: Response): Promise<void> {
    const health = await this.healthService.getHealth();
    const httpStatus = health.status === 'unhealthy' 
      ? HttpStatus.SERVICE_UNAVAILABLE 
      : HttpStatus.OK;

    res.status(httpStatus).json(health);
  }
}
