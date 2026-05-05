import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode, Delete, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ClubMemberService } from '../services/club-member.service';
import { ApproveJoinDto } from '../dto/approve-join.dto';
import { ClubMemberResponseDto, ClubMemberListDto, ClubMemberDetailDto } from '../dto/join-club.dto';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';

@ApiTags('Club Members')
@Controller('clubs/:clubId/members')
export class ClubMemberController {
  constructor(private clubMemberService: ClubMemberService) {}

  @Post('join')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Gửi yêu cầu tham gia câu lạc bộ' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 201, description: 'Gửi yêu cầu thành công', type: ClubMemberResponseDto })
  @ApiResponse({ status: 400, description: 'Lỗi: câu lạc bộ không active hoặc đã join' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async joinClub(@Param('clubId') clubId: string, @Request() req): Promise<ClubMemberResponseDto> {
    return this.clubMemberService.joinClub(clubId, req.user.id);
  }

  @Post(':memberId/approve')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duyệt hoặc từ chối yêu cầu tham gia (chủ câu lạc bộ only)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiParam({ name: 'memberId', description: 'ID của yêu cầu tham gia' })
  @ApiResponse({ status: 200, description: 'Duyệt thành công', type: ClubMemberResponseDto })
  @ApiResponse({ status: 400, description: 'Lỗi: yêu cầu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Yêu cầu tham gia không tồn tại' })
  async approveMemberJoin(
    @Param('clubId') clubId: string,
    @Param('memberId') memberId: string,
    @Body() approveJoinDto: ApproveJoinDto,
    @Request() req,
  ): Promise<ClubMemberResponseDto> {
    return this.clubMemberService.approveMemberJoin(clubId, memberId, req.user.id, approveJoinDto);
  }

  @Get('manage')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quản lý thành viên - xem tất cả trạng thái (leader only)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiQuery({ name: 'status', enum: ['pending', 'active', 'rejected', 'inactive'], required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'skip', type: Number, required: false, description: 'Số bản ghi bỏ qua (default: 0)' })
  @ApiQuery({ name: 'take', type: Number, required: false, description: 'Số bản ghi lấy (default: 10)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ leader mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async getMembersForManagement(
    @Param('clubId') clubId: string,
    @Request() req,
    @Query('status') status?: 'pending' | 'active' | 'rejected' | 'inactive',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<any> {
    return this.clubMemberService.getMembersForManagement(
      clubId,
      req.user.id,
      status,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 10,
    );
  }

  @Get()
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách thành viên đang hoạt động (member/leader/admin only)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công', type: [ClubMemberListDto] })
  @ApiResponse({ status: 403, description: 'Bạn không có quyền xem' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async getActiveMembers(@Param('clubId') clubId: string, @Request() req): Promise<ClubMemberListDto[]> {
    // Check if requester is member of club or admin
    return this.clubMemberService.getActiveMembers(clubId);
  }

  @Get(':userId')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết thành viên (member/leader/admin only)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiParam({ name: 'userId', description: 'ID của thành viên' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công', type: ClubMemberDetailDto })
  @ApiResponse({ status: 403, description: 'Bạn không có quyền xem' })
  @ApiResponse({ status: 404, description: 'Thành viên không tồn tại' })
  async getMemberDetail(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<ClubMemberDetailDto> {
    return this.clubMemberService.getMemberDetail(clubId, userId, req.user.id);
  }

  @Patch(':userId/role')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thay đổi vai trò thành viên (chủ câu lạc bộ only)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiParam({ name: 'userId', description: 'ID của thành viên' })
  @ApiResponse({ status: 200, description: 'Thay đổi vai trò thành công', type: ClubMemberResponseDto })
  @ApiResponse({ status: 400, description: 'Lỗi: yêu cầu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Thành viên không tồn tại' })
  async changeRole(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Body() changeRoleDto: ChangeRoleDto,
    @Request() req,
  ): Promise<ClubMemberResponseDto> {
    return this.clubMemberService.changeRole(clubId, userId, req.user.id, changeRoleDto.role);
  }

  @Delete(':userId')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Xóa thành viên (chủ câu lạc bộ only, soft delete)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiParam({ name: 'userId', description: 'ID của thành viên' })
  @ApiResponse({ status: 200, description: 'Xóa thành công', type: ClubMemberResponseDto })
  @ApiResponse({ status: 400, description: 'Lỗi: yêu cầu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ chủ câu lạc bộ mới có quyền' })
  @ApiResponse({ status: 404, description: 'Thành viên không tồn tại' })
  async removeMember(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<ClubMemberResponseDto> {
    return this.clubMemberService.removeMember(clubId, userId, req.user.id);
  }

  @Get('admin/all')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả thành viên (admin only, có filter và phân trang)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiQuery({ name: 'status', enum: ['pending', 'active', 'rejected', 'inactive'], required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'skip', type: Number, required: false, description: 'Số bản ghi bỏ qua (default: 0)' })
  @ApiQuery({ name: 'take', type: Number, required: false, description: 'Số bản ghi lấy (default: 10)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền' })
  @ApiResponse({ status: 404, description: 'Câu lạc bộ không tồn tại' })
  async getAllMembersForAdmin(
    @Param('clubId') clubId: string,
    @Query('status') status?: 'pending' | 'active' | 'rejected' | 'inactive',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<any> {
    return this.clubMemberService.getAllMembersForAdmin(
      clubId,
      status,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 10,
    );
  }

  @Delete(':userId/admin')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa thành viên (admin only, hard delete)' })
  @ApiParam({ name: 'clubId', description: 'ID của câu lạc bộ' })
  @ApiParam({ name: 'userId', description: 'ID của thành viên' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi: không thể xóa chủ câu lạc bộ' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền' })
  @ApiResponse({ status: 404, description: 'Thành viên không tồn tại' })
  async forceRemoveMember(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.clubMemberService.forceRemoveMember(clubId, userId);
  }
}
