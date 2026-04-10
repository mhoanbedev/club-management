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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { EventService } from '../services/event.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import { UploadService } from '../../upload/upload.service';

@ApiTags('Events')
@Controller('clubs/:clubId/events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventController {
  constructor(
    private eventService: EventService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Tạo sự kiện (chỉ leader)' })
  @ApiResponse({ status: 201, description: 'Sự kiện được tạo thành công', type: EventResponseDto })
  async createEvent(
    @Param('clubId') clubId: string,
    @Body() createEventDto: CreateEventDto,
    @Request() req: any,
  ) {
    return this.eventService.createEvent(clubId, createEventDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách sự kiện cho thành viên (published|ongoing|finished, chưa xóa)' })
  @ApiResponse({ status: 200, description: 'Danh sách sự kiện' })
  @ApiQuery({ name: 'status', enum: ['published', 'ongoing', 'finished'], required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'skip', type: Number, required: false, description: 'Số bản ghi bỏ qua' })
  @ApiQuery({ name: 'take', type: Number, required: false, description: 'Số bản ghi lấy' })
  async getEventsForMembers(
    @Param('clubId') clubId: string,
    @Request() req: any,
    @Query('status') status?: 'published' | 'ongoing' | 'finished',
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    const skipNum = parseInt(String(skip), 10) || 0;
    const takeNum = parseInt(String(take), 10) || 10;

    return this.eventService.getEventsForMembers(clubId, req.user.id, skipNum, takeNum, status);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Danh sách sự kiện cho admin/leader (tất cả trạng thái, bao gồm đã xóa)' })
  @ApiResponse({ status: 200, description: 'Danh sách sự kiện' })
  @ApiQuery({ name: 'status', enum: ['draft', 'published', 'ongoing', 'finished'], required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'includeDeleted', type: Boolean, required: false, description: 'Bao gồm sự kiện đã xóa' })
  @ApiQuery({ name: 'skip', type: Number, required: false, description: 'Số bản ghi bỏ qua' })
  @ApiQuery({ name: 'take', type: Number, required: false, description: 'Số bản ghi lấy' })
  async getEventsForAdmin(
    @Param('clubId') clubId: string,
    @Request() req: any,
    @Query('status') status?: 'draft' | 'published' | 'ongoing' | 'finished',
    @Query('includeDeleted') includeDeleted?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    const skipNum = parseInt(String(skip), 10) || 0;
    const takeNum = parseInt(String(take), 10) || 10;
    const includeDeletedBool = includeDeleted === 'true';

    return this.eventService.getEventsForAdmin(clubId, req.user.id, skipNum, takeNum, status, includeDeletedBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sự kiện cho thành viên (published|ongoing|finished, chưa xóa)' })
  @ApiResponse({ status: 200, description: 'Chi tiết sự kiện', type: EventResponseDto })
  async getEventDetailForMembers(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.eventService.getEventDetailForMembers(clubId, id, req.user.id);
  }

  @Get(':id/admin')
  @ApiOperation({ summary: 'Chi tiết sự kiện cho admin/leader (tất cả trạng thái)' })
  @ApiResponse({ status: 200, description: 'Chi tiết sự kiện', type: EventResponseDto })
  async getEventDetailForAdmin(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.eventService.getEventDetailForAdmin(clubId, id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật sự kiện (chỉ leader)' })
  @ApiResponse({ status: 200, description: 'Sự kiện được cập nhật thành công', type: EventResponseDto })
  async updateEvent(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any,
  ) {
    return this.eventService.updateEvent(clubId, id, updateEventDto, req.user.id);
  }

  @Patch(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh sự kiện (jpg, png, gif, webp, max 5MB)',
        },
      },
      required: ['image'],
    },
  })
  @ApiOperation({ summary: 'Cập nhật ảnh sự kiện (chỉ leader)' })
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh thành công' })
  async updateEventImage(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<{ success: boolean; data: EventResponseDto; message: string }> {
    const imageUrl = await this.uploadService.uploadFile(file, 'club-management/events');
    const event = await this.eventService.updateEventImage(clubId, id, imageUrl, req.user.id);
    return {
      success: true,
      data: event,
      message: 'Cập nhật ảnh sự kiện thành công',
    };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Xóa mềm sự kiện (chỉ leader)' })
  @ApiResponse({ status: 200, description: 'Sự kiện được xóa thành công' })
  async deleteEvent(
    @Param('clubId') clubId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.eventService.deleteEvent(clubId, id, req.user.id);

    return {
      success: true,
      data: null,
      message: 'Sự kiện được xóa thành công',
    };
  }
}
