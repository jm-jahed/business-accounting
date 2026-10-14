import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../../auth/jwt.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required. Missing Bearer token.');
    }

    const token = authHeader.substring(7).trim();
    try {
      const payload = this.jwtService.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }
}
