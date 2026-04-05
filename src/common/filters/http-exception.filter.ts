import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HttpExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'Lỗi hệ thống';

    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      const msg = (exceptionResponse as any).message;
      // Handle array of messages (from validation)
      message = Array.isArray(msg) ? msg[0] : msg;
    }

    this.logger.error(`[${status}] ${message}`, exception.stack);

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

    // Skip if it's already an HttpException (handled by HttpExceptionFilter)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message = 'Lỗi hệ thống';

      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
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
