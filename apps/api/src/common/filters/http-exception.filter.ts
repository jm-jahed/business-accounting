/**
 * Business Accounting & Management System
 * Centralized Exception Filter with Secret Redaction
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { sanitizeErrorMessage } from '@accounting/database';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        message = Array.isArray(obj.message) ? obj.message.join('; ') : (obj.message || message);
        errorType = obj.error || exception.name;
      }
    } else if (exception instanceof Error) {
      errorType = exception.name;
      // In development, show error details; in production, keep generic for unhandled exceptions
      message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : sanitizeErrorMessage(exception.message);
    }

    const safeMessage = sanitizeErrorMessage(message);
    const sanitizedErrorType = sanitizeErrorMessage(errorType);

    // Redacted structured log
    this.logger.error(
      `[${request.method}] ${request.url} - Status ${status} - Error: ${sanitizedErrorType}: ${safeMessage}`
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error: sanitizedErrorType,
      message: safeMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
