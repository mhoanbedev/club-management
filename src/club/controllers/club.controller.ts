import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, Query, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ClubService } from '../services/club.service';
import { ClubMemberService } from '../../club-member/services/club-member.service';
import { CreateClubDto } from '../dto/create-club.dto';
import { UpdateClubDto } from '../dto/update-club.dto';
import { ApproveClubDto } from '../dto/approve-club.dto';
import { ClubResponseDto } from '../dto/club-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { ClubLeaderGuard } from '../guards/club-leader.guard';
import { UploadService } from '../../upload/upload.service';

@ApiTags('Clubs')
@Controller('clubs')
export class ClubController {
  constructor(
    private clubService: ClubService,
    private clubMemberService: ClubMemberService,
    private uploadService: UploadService,
  ) {}

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
    const approvedClub = await this.clubService.approveClub(id, approveClubDto);
    
    if (approveClubDto.status === 'active' && this.clubMemberService) {
      await this.clubMemberService.autoAddLeaderWhenClubApproved(id, approvedClub.leaderId);
    }
    
    return approvedClub;
  }

  @Patch(':id/image')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh câu lạc bộ (jpg, png, gif, webp, max 5MB)',
        },
      },
      required: ['image'],
    },
  })
  @ApiOperation({ summary: 'Cập nhật ảnh câu lạc bộ (chủ câu lạc bộ only)' })
  @ApiParam({ name: 'id', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async updateClubImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ): Promise<{ success: boolean; data: ClubResponseDto; message: string }> {
    const imageUrl = await this.uploadService.uploadFile(file, 'club-management/clubs');
    const club = await this.clubService.updateClubImage(id, imageUrl, req.user.id);
    return {
      success: true,
      data: club,
      message: 'Cập nhật ảnh câu lạc bộ thành công',
    };
  }

  @Post(':id/gallery/batch')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách ảnh album (jpg, png, gif, webp, max 5MB mỗi ảnh, tối đa 10 ảnh)',
        },
      },
      required: ['images'],
    },
  })
  @ApiOperation({ summary: 'Thêm nhiều ảnh vào album câu lạc bộ (chủ câu lạc bộ only, tối đa 10 ảnh)' })
  @ApiParam({ name: 'id', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 201, description: 'Thêm ảnh thành công' })
  @ApiResponse({ status: 400, description: 'Album đã đầy hoặc quá nhiều ảnh' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async addGalleryImagesBatch(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ): Promise<{ success: boolean; data: ClubResponseDto; message: string }> {
    const imageUrls: string[] = [];
    if (files && Array.isArray(files)) {
      for (const file of files) {
        const imageUrl = await this.uploadService.uploadFile(file, 'club-management/clubs/gallery');
        imageUrls.push(imageUrl);
      }
    }
    const club = await this.clubService.addGalleryImagesBatch(id, imageUrls, req.user.id);
    return {
      success: true,
      data: club,
      message: `Thêm ${imageUrls.length} ảnh vào album thành công`,
    };
  }

  @Delete(':id/gallery/:imageUrl')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Xóa ảnh khỏi album (chủ câu lạc bộ only)' })
  @ApiParam({ name: 'id', description: 'ID của câu lạc bộ' })
  @ApiParam({ name: 'imageUrl', description: 'URL của ảnh cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa ảnh thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ hoặc ảnh không tồn tại' })
  async removeGalleryImage(
    @Param('id') id: string,
    @Param('imageUrl') imageUrl: string,
    @Request() req,
  ): Promise<{ success: boolean; data: ClubResponseDto; message: string }> {
    const club = await this.clubService.removeGalleryImage(id, decodeURIComponent(imageUrl), req.user.id);
    return {
      success: true,
      data: club,
      message: 'Xóa ảnh khỏi album thành công',
    };
  }
}
