import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ClubService } from '../services/club.service';
import { CreateClubDto } from '../dto/create-club.dto';
import { UpdateClubDto } from '../dto/update-club.dto';
import { ApproveClubDto } from '../dto/approve-club.dto';
import { ClubResponseDto } from '../dto/club-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { ClubLeaderGuard } from '../guards/club-leader.guard';

@ApiTags('Clubs')
@Controller('clubs')
export class ClubController {
  constructor(private clubService: ClubService) {}

  @Post()
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, ClubLeaderGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Tạo câu lạc bộ (club_leader only)' })
  @ApiResponse({ status: 201, description: 'Tạo câu lạc bộ thành công', type: ClubResponseDto })
  @ApiResponse({ status: 400, description: 'Tên câu lạc bộ đã tồn tại' })
  @ApiResponse({ status: 403, description: 'Chỉ club leader mới có quyền' })
  async createClub(@Body() createClubDto: CreateClubDto, @Request() req): Promise<ClubResponseDto> {
    return this.clubService.createClub(createClubDto, req.user.id);
  }

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy danh sách câu lạc bộ đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công', type: [ClubResponseDto] })
  async getAllClubs(): Promise<ClubResponseDto[]> {
    return this.clubService.getActiveClubs();
  }

  @Get('admin/all')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả câu lạc bộ (admin only, có filter)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công', type: [ClubResponseDto] })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền' })
  async getAllClubsForAdmin(
    @Query('status') status?: 'pending' | 'active' | 'inactive',
  ): Promise<ClubResponseDto[]> {
    return this.clubService.getAllClubsForAdmin(status);
  }

  @Get('my-clubs')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, ClubLeaderGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả câu lạc bộ của tôi (club_leader only, có filter)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công', type: [ClubResponseDto] })
  @ApiResponse({ status: 403, description: 'Chỉ club leader mới có quyền' })
  async getMyClubs(
    @Request() req,
    @Query('status') status?: 'pending' | 'active' | 'inactive',
  ): Promise<ClubResponseDto[]> {
    return this.clubService.getMyClubs(req.user.id, status);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết câu lạc bộ đang hoạt động' })
  @ApiParam({ name: 'id', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công', type: ClubResponseDto })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async getClubById(@Param('id') id: string): Promise<ClubResponseDto> {
    return this.clubService.getActiveClubById(id);
  }

  @Patch(':id')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin câu lạc bộ (chủ câu lạc bộ only)' })
  @ApiParam({ name: 'id', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công', type: ClubResponseDto })
  @ApiResponse({ status: 400, description: 'Tên câu lạc bộ đã tồn tại' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async updateClub(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto,
    @Request() req,
  ): Promise<ClubResponseDto> {
    return this.clubService.updateClub(id, updateClubDto, req.user.id);
  }

  @Delete(':id')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa câu lạc bộ (admin only)' })
  @ApiParam({ name: 'id', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async deleteClub(@Param('id') id: string): Promise<void> {
    return this.clubService.deleteClub(id);
  }

  @Patch(':id/approve')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chấp nhận hoặc từ chối câu lạc bộ (admin only)' })
  @ApiParam({ name: 'id', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công', type: ClubResponseDto })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async approveClub(
    @Param('id') id: string,
    @Body() approveClubDto: ApproveClubDto,
  ): Promise<ClubResponseDto> {
    return this.clubService.approveClub(id, approveClubDto);
  }
}
