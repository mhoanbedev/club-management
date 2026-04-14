import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch(HttpException, ThrottlerException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HttpExceptionFilter');

  catch(exception: HttpException | ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi hệ thống';
    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // If response is a string, use it directly
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const msg = (exceptionResponse as any).message;
        message = Array.isArray(msg) ? msg[0] : msg;
      }
    }
    this.logger.error(`[${status}] ${message}`, exception instanceof Error ? exception.stack : '');

    response.status(status).json({
      success: false,
      data: null,
      message: message,
      statusCode: status,
    });
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof ThrottlerException) {
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        data: null,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message = 'Lỗi hệ thống';

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const msg = (exceptionResponse as any).message;
        message = Array.isArray(msg) ? msg[0] : msg;
      }

      response.status(status).json({
        success: false,
        data: null,
        message: message,
        statusCode: status,
      });
      return;
    }

    this.logger.error('Unhandled Exception:', exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      data: null,
      message: 'Lỗi hệ thống',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
