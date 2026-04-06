import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ClubLeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user || user.role !== 'club_leader') {
      throw new ForbiddenException('Chỉ club leader mới có quyền thực hiện hành động này');
    }

    return true;
  }
}
