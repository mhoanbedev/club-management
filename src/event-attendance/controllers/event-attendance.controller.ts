import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { EventAttendanceService } from '../services/event-attendance.service';
import { CheckInQrDto } from '../dto/check-in-qr.dto';
import { CheckInManualDto } from '../dto/check-in-manual.dto';
import { CheckOutDto } from '../dto/check-out.dto';

@ApiTags('Event Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clubs/:clubId/events')
export class EventAttendanceController {
  constructor(private attendanceService: EventAttendanceService) {}

  @ApiOperation({ summary: 'Tạo mã QR để điểm danh (Trưởng nhóm)' })
  @Post(':eventId/attendance/generate-qr')
  async generateQrCode(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    const qrCode = await this.attendanceService.generateQrCode(clubId, eventId, req.user.id);
    return {
      success: true,
      data: qrCode,
      message: 'Tạo mã QR thành công',
    };
  }

  @ApiOperation({ summary: 'Điểm danh bằng quét QR (Thành viên hoặc Trưởng nhóm)' })
  @ApiBody({ type: CheckInQrDto })
  @Post(':eventId/attendance/check-in/qr')
  async checkInQr(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CheckInQrDto,
    @Request() req: any,
  ) {
    const attendance = await this.attendanceService.checkInQr(
      clubId,
      eventId,
      req.user.id,
      dto.qrCode,
    );
    return {
      success: true,
      data: attendance,
      message: 'Điểm danh bằng QR thành công',
    };
  }

  @ApiOperation({ summary: 'Điểm danh thủ công cho thành viên (Trưởng nhóm)' })
  @ApiBody({ type: CheckInManualDto })
  @Post(':eventId/attendance/check-in/manual')
  async checkInManual(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CheckInManualDto,
    @Request() req: any,
  ) {
    const attendance = await this.attendanceService.checkInManual(
      clubId,
      eventId,
      req.user.id,
      dto.userId,
    );
    return {
      success: true,
      data: attendance,
      message: 'Điểm danh thủ công thành công',
    };
  }


  @ApiOperation({ summary: 'Check-out cho thành viên (Trưởng nhóm)' })
  @ApiBody({ type: CheckOutDto })
  @Post(':eventId/attendance/check-out')
  async checkOut(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CheckOutDto,
    @Request() req: any,
  ) {
    const attendance = await this.attendanceService.checkOut(
      clubId,
      eventId,
      req.user.id,
      dto.userId,
    );
    return {
      success: true,
      data: attendance,
      message: 'Check-out thành công',
    };
  }


  @ApiOperation({ summary: 'Xem danh sách điểm danh sự kiện (Trưởng nhóm)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @Get(':eventId/attendance')
  async getAttendanceList(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Request() req: any,
  ) {
    const result = await this.attendanceService.getAttendanceList(
      clubId,
      eventId,
      req.user.id,
      parseInt(skip, 10),
      parseInt(take, 10),
    );
    return {
      success: true,
      data: result,
      message: 'Lấy danh sách điểm danh thành công',
    };
  }

  @ApiOperation({ summary: 'Xem chi tiết điểm danh của bản thân cho sự kiện (Thành viên)' })
  @Get(':eventId/attendance/me')
  async getMemberAttendanceDetail(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    const attendance = await this.attendanceService.getMemberAttendanceDetail(
      req.user.id,
      clubId,
      eventId,
    );
    return {
      success: true,
      data: attendance,
      message: 'Lấy chi tiết điểm danh thành công',
    };
  }

  @ApiOperation({ summary: 'Xem chi tiết điểm danh của thành viên (Trưởng nhóm)' })
  @Get(':eventId/attendance/:userId')
  async getAttendanceDetail(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const attendance = await this.attendanceService.getAttendanceDetail(
      clubId,
      eventId,
      req.user.id,
      userId,
    );
    return {
      success: true,
      data: attendance,
      message: 'Lấy chi tiết điểm danh thành công',
    };
  }


  @ApiOperation({ summary: 'Xem danh sách điểm danh của bản thân ở tất cả sự kiện (Thành viên)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @Get('members/me/attendance')
  async getMemberAttendanceList(
    @Param('clubId') clubId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Request() req: any,
  ) {
    const result = await this.attendanceService.getMemberAttendanceList(
      req.user.id,
      clubId,
      parseInt(skip, 10),
      parseInt(take, 10),
    );
    return {
      success: true,
      data: result,
      message: 'Lấy danh sách điểm danh thành công',
    };
  }
}
