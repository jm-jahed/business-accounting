import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUserPayload } from '../../auth/jwt.service.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
