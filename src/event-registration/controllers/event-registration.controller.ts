import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { EventRegistrationService } from '../services/event-registration.service';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { RegistrationResponseDto } from '../dto/registration-response.dto';

@ApiTags('Event Registrations')
@Controller('clubs/:clubId/events/:eventId/registrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventRegistrationController {
  constructor(private registrationService: EventRegistrationService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Đăng ký sự kiện (member only)' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công', type: RegistrationResponseDto })
  async registerEvent(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Body() createRegistrationDto: CreateRegistrationDto,
    @Request() req: any,
  ) {
    createRegistrationDto.eventId = eventId;
    return this.registrationService.registerEvent(clubId, createRegistrationDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách đăng ký sự kiện (leader only)' })
  @ApiResponse({ status: 200, description: 'Danh sách đăng ký' })
  @ApiQuery({ name: 'status', enum: ['pending', 'approved', 'rejected', 'cancelled'], required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'skip', type: Number, required: false, description: 'Số bản ghi bỏ qua' })
  @ApiQuery({ name: 'take', type: Number, required: false, description: 'Số bản ghi lấy' })
  async getRegistrations(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Request() req: any,
    @Query('status') status?: 'pending' | 'approved' | 'rejected' | 'cancelled',
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    const skipNum = parseInt(String(skip), 10) || 0;
    const takeNum = parseInt(String(take), 10) || 10;

    return this.registrationService.getRegistrationsByEvent(
      clubId,
      eventId,
      req.user.id,
      skipNum,
      takeNum,
      status,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Xem đăng ký của tôi (member only)' })
  @ApiResponse({ status: 200, description: 'Chi tiết đăng ký', type: RegistrationResponseDto })
  async getMyRegistration(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    return this.registrationService.getMyRegistration(clubId, eventId, req.user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Chi tiết đăng ký của user (leader only)' })
  @ApiResponse({ status: 200, description: 'Chi tiết đăng ký', type: RegistrationResponseDto })
  async getRegistrationDetail(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.registrationService.getRegistrationDetail(clubId, eventId, userId, req.user.id);
  }

  @Patch(':userId/approve')
  @ApiOperation({ summary: 'Duyệt đăng ký (leader only)' })
  @ApiResponse({ status: 200, description: 'Duyệt thành công', type: RegistrationResponseDto })
  async approveRegistration(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.registrationService.approveRegistration(clubId, eventId, userId, req.user.id);
  }

  @Patch(':userId/reject')
  @ApiOperation({ summary: 'Từ chối đăng ký (leader only)' })
  @ApiResponse({ status: 200, description: 'Từ chối thành công', type: RegistrationResponseDto })
  async rejectRegistration(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.registrationService.rejectRegistration(clubId, eventId, userId, req.user.id);
  }

  @Delete(':userId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Hủy đăng ký (member only)' })
  @ApiResponse({ status: 200, description: 'Hủy thành công' })
  async cancelRegistration(
    @Param('clubId') clubId: string,
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    // Check if user is cancelling their own registration
    if (req.user.id !== userId) {
      throw new Error('Bạn chỉ có thể hủy đăng ký của chính mình');
    }

    await this.registrationService.cancelRegistration(clubId, eventId, req.user.id);

    return {
      success: true,
      data: null,
      message: 'Hủy đăng ký thành công',
    };
  }
}
