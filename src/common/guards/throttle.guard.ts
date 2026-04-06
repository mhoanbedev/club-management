import { Injectable, HttpException, HttpStatus, Logger, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private logger = new Logger('CustomThrottlerGuard');

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    this.logger.debug(`Tracking IP: ${ip}`);
    return ip;
  }

  protected async throwThrottlingException(): Promise<void> {
    this.logger.warn('Rate limit exceeded');
    throw new HttpException(
      'Quá nhiều yêu cầu, vui lòng thử lại sau',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
