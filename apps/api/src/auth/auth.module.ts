import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtService } from './jwt.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { GoogleAuthService } from './google-auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard, GoogleAuthService],
  exports: [AuthService, JwtService, JwtAuthGuard, GoogleAuthService],
})
export class AuthModule {}

