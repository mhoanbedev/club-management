import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { MemberPointService } from '../services/member-point.service';
import { PointConfigDto } from '../dto/point-config.dto';
import { ClubMemberRepository } from '../../club-member/repositories/club-member.repository';

@ApiTags('Điểm thành viên')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clubs/:clubId/members')
export class MemberPointController {
  constructor(
    private pointService: MemberPointService,
    private clubMemberRepository: ClubMemberRepository,
  ) {}

  private async verifyLeader(clubId: string, userId: string): Promise<void> {
    const clubMember = await this.clubMemberRepository.findByClubAndUserAndStatus(
      clubId,
      userId,
      'active',
    );
    if (!clubMember || clubMember.role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có quyền thực hiện hành động này');
    }
  }

  @ApiOperation({ summary: 'Xem bảng xếp hạng điểm (Tất cả thành viên)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @Get('points/leaderboard')
  async getLeaderboard(
    @Param('clubId') clubId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Request() req: any,
  ) {
    const result = await this.pointService.getLeaderboard(
      clubId,
      parseInt(skip, 10),
      parseInt(take, 10),
    );
    return {
      success: true,
      data: result,
      message: 'Lấy bảng xếp hạng thành công',
    };
  }

  @ApiOperation({ summary: 'Xem điểm của bản thân (Thành viên)' })
  @Get('me/points')
  async getMemberPoints(
    @Param('clubId') clubId: string,
    @Request() req: any,
  ) {
    const result = await this.pointService.getMemberPoints(clubId, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Lấy điểm thành công',
    };
  }

  @ApiOperation({ summary: 'Xem điểm của thành viên khác (Trưởng nhóm)' })
  @Get(':userId/points')
  async getMemberPointsDetail(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    await this.verifyLeader(clubId, req.user.id);
    const result = await this.pointService.getMemberPoints(clubId, userId);
    return {
      success: true,
      data: result,
      message: 'Lấy điểm thành công',
    };
  }

  @ApiOperation({ summary: 'Xem lịch sử điểm (Thành viên hoặc Trưởng nhóm)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @Get(':userId/points/history')
  async getPointHistory(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Request() req: any,
  ) {
    if (req.user.id !== userId) {
      await this.verifyLeader(clubId, req.user.id);
    }
    const result = await this.pointService.getPointHistory(
      clubId,
      userId,
      parseInt(skip, 10),
      parseInt(take, 10),
    );
    return {
      success: true,
      data: result,
      message: 'Lấy lịch sử điểm thành công',
    };
  }

  @ApiOperation({ summary: 'Xem cấu hình điểm (Trưởng nhóm)' })
  @Get('points/config')
  async getPointConfig(
    @Param('clubId') clubId: string,
    @Request() req: any,
  ) {
    await this.verifyLeader(clubId, req.user.id);
    const result = await this.pointService.getPointConfig(clubId);
    return {
      success: true,
      data: result,
      message: 'Lấy cấu hình điểm thành công',
    };
  }

  @ApiOperation({ summary: 'Tính lại điểm cho thành viên (Trưởng nhóm)' })
  @Patch(':userId/points/recalculate')
  async recalculateUserPoints(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    await this.verifyLeader(clubId, req.user.id);
    const totalPoints = await this.pointService.recalculateUserPoints(clubId, userId);
    return {
      success: true,
      data: { userId, totalPoints },
      message: 'Tính lại điểm thành công',
    };
  }
}

@ApiTags('Quản lý điểm (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/clubs/:clubId/points')
export class AdminPointConfigController {
  constructor(private pointService: MemberPointService) {}

  @ApiOperation({ summary: 'Xem cấu hình điểm (Admin)' })
  @Get('config')
  async getPointConfigAdmin(
    @Param('clubId') clubId: string,
    @Request() req: any,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền xem cấu hình điểm');
    }
    const result = await this.pointService.getPointConfigAdmin(clubId, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Lấy cấu hình điểm thành công',
    };
  }

  @ApiOperation({ summary: 'Cập nhật cấu hình điểm (Admin)' })
  @ApiBody({ type: PointConfigDto })
  @Patch('config')
  async updatePointConfigAdmin(
    @Param('clubId') clubId: string,
    @Body() dto: PointConfigDto,
    @Request() req: any,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền cập nhật cấu hình điểm');
    }
    const result = await this.pointService.updatePointConfigAdmin(
      clubId,
      req.user.id,
      dto.leaderPoints,
      dto.memberPoints,
    );
    return {
      success: true,
      data: result,
      message: 'Cập nhật cấu hình điểm thành công',
    };
  }
}
