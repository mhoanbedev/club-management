import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { EventTypeService } from '../services/event-type.service';
import { CreateEventTypeDto } from '../dto/create-event-type.dto';
import { EventTypeResponseDto } from '../dto/event-type-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@ApiTags('Event Types')
@Controller('clubs/:clubId/event-types')
export class EventTypeController {
  constructor(private eventTypeService: EventTypeService) {}

  @Post()
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Tạo loại sự kiện (chủ câu lạc bộ only)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 201, description: 'Tạo loại sự kiện thành công', type: EventTypeResponseDto })
  @ApiResponse({ status: 400, description: 'Lỗi: loại sự kiện đã tồn tại' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async createEventType(
    @Param('clubId') clubId: string,
    @Body() createEventTypeDto: CreateEventTypeDto,
    @Request() req,
  ): Promise<EventTypeResponseDto> {
    return this.eventTypeService.createEventType(clubId, req.user.id, createEventTypeDto);
  }

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy danh sách loại sự kiện' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công', type: [EventTypeResponseDto] })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async getEventTypes(@Param('clubId') clubId: string): Promise<EventTypeResponseDto[]> {
    return this.eventTypeService.getEventTypes(clubId);
  }

  @Delete(':typeId')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Xóa loại sự kiện (chủ câu lạc bộ only)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiParam({ name: 'typeId', description: 'ID của loại sự kiện' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Loại sự kiện không tồn tại' })
  async deleteEventType(
    @Param('clubId') clubId: string,
    @Param('typeId') typeId: string,
    @Request() req,
  ): Promise<void> {
    return this.eventTypeService.deleteEventType(clubId, typeId, req.user.id);
  }
}
