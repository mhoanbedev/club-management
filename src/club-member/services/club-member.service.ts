import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validate as validateUUID } from 'uuid';
import { ClubMemberRepository } from '../repositories/club-member.repository';
import { ClubRepository } from '../../club/repositories/club.repository';
import { ApproveJoinDto } from '../dto/approve-join.dto';
import { ClubMemberEntity } from '../../entities/club-member.entity';

@Injectable()
export class ClubMemberService {
  constructor(
    private clubMemberRepository: ClubMemberRepository,
    private clubRepository: ClubRepository,
    private dataSource: DataSource,
  ) {}

  async joinClub(clubId: string, userId: string): Promise<ClubMemberEntity> {
    const club = await this.clubRepository.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    if (club.status !== 'active') {
      throw new BadRequestException('Câu lạc bộ không đang hoạt động');
    }

    const existingMember = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    
    if (existingMember) {
      if (existingMember.status === 'pending') {
        throw new BadRequestException('Bạn đã gửi yêu cầu tham gia, vui lòng chờ duyệt');
      }
      if (existingMember.status === 'active') {
        throw new BadRequestException('Bạn đã là thành viên của câu lạc bộ này');
      }
      if (existingMember.status === 'rejected') {
        throw new BadRequestException('Yêu cầu tham gia của bạn đã bị từ chối, không thể gửi lại');
      }
      if (existingMember.status === 'inactive') {
        throw new BadRequestException('Bạn đã rời khỏi câu lạc bộ này');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const member = await this.clubMemberRepository.createMember(
        clubId,
        userId,
        'member',
        'pending',
        queryRunner,
      );
      
      await queryRunner.commitTransaction();
      return member;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approveMemberJoin(
    clubId: string,
    memberId: string,
    leaderId: string,
    approveJoinDto: ApproveJoinDto,
  ): Promise<ClubMemberEntity> {
    const leaderMember = await this.clubMemberRepository.findActiveByClubAndUser(clubId, leaderId);
    if (!leaderMember || leaderMember.role !== 'leader') {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền duyệt');
    }

    const member = await this.clubMemberRepository.findById(memberId);
    if (!member) {
      throw new NotFoundException('Yêu cầu tham gia không tồn tại');
    }

    if (member.clubId !== clubId) {
      throw new BadRequestException('Yêu cầu tham gia không thuộc câu lạc bộ này');
    }

    if (member.status !== 'pending') {
      throw new BadRequestException('Yêu cầu tham gia không ở trạng thái chờ duyệt');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let updatedMember: ClubMemberEntity | null;

      if (approveJoinDto.status === 'active') {
        updatedMember = await this.clubMemberRepository.updateStatus(
          memberId,
          'active',
          queryRunner,
        );
      } else {
        updatedMember = await this.clubMemberRepository.updateStatus(
          memberId,
          'rejected',
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
      return updatedMember as ClubMemberEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async autoAddLeaderWhenClubApproved(clubId: string, leaderId: string): Promise<void> {
    const existingMember = await this.clubMemberRepository.findByClubAndUser(clubId, leaderId);
    if (existingMember) {
      return;
    }

    await this.clubMemberRepository.createMember(clubId, leaderId, 'leader', 'active');
  }

  async getActiveMembers(clubId: string): Promise<any[]> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const members = await this.clubMemberRepository.findActiveByClubId(clubId);
    
    return members.map(member => ({
      id: member.id,
      userId: member.userId,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      approvedAt: member.approvedAt,
    }));
  }

  async getMemberDetail(clubId: string, userId: string, requesterId: string): Promise<any> {
    if (!validateUUID(clubId) || !validateUUID(userId) || !validateUUID(requesterId)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const requesterMember = await this.clubMemberRepository.findActiveByClubAndUser(clubId, requesterId);
    
    if (!requesterMember) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin này');
    }

    const member = await this.clubMemberRepository.findByClubAndUserId(clubId, userId);
    if (!member) {
      throw new NotFoundException('Thành viên không tồn tại');
    }

    return {
      id: member.id,
      userId: member.userId,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
      clubId: member.clubId,
      club: {
        id: member.club.id,
        name: member.club.name,
        description: member.club.description,
      },
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      approvedAt: member.approvedAt,
      rejectedAt: member.rejectedAt,
    };
  }

  async changeRole(
    clubId: string,
    userId: string,
    leaderId: string,
    newRole: 'leader' | 'member',
  ): Promise<ClubMemberEntity> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const leaderMember = await this.clubMemberRepository.findActiveByClubAndUser(clubId, leaderId);
    if (!leaderMember || leaderMember.role !== 'leader') {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền thay đổi vai trò');
    }

    if (leaderId === userId) {
      throw new BadRequestException('Không thể tự thay đổi vai trò của mình');
    }

    const member = await this.clubMemberRepository.findByClubAndUserId(clubId, userId);
    if (!member) {
      throw new NotFoundException('Thành viên không tồn tại');
    }

    if (member.status !== 'active') {
      throw new BadRequestException('Chỉ có thể thay đổi vai trò của thành viên đang hoạt động');
    }

    if (member.user.role === 'club_leader') {
      throw new BadRequestException('Không thể thay đổi vai trò của chủ câu lạc bộ');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedMember = await this.clubMemberRepository.updateRole(member.id, newRole, queryRunner);
      await queryRunner.commitTransaction();
      return updatedMember as ClubMemberEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeMember(
    clubId: string,
    userId: string,
    leaderId: string,
  ): Promise<ClubMemberEntity> {
    const leaderMember = await this.clubMemberRepository.findActiveByClubAndUser(clubId, leaderId);
    if (!leaderMember || leaderMember.role !== 'leader') {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền xóa thành viên');
    }

    const member = await this.clubMemberRepository.findByClubAndUserId(clubId, userId);
    if (!member) {
      throw new NotFoundException('Thành viên không tồn tại');
    }

    if (member.status !== 'active') {
      throw new BadRequestException('Chỉ có thể xóa thành viên đang hoạt động');
    }

    if (member.role === 'leader') {
      throw new BadRequestException('Không thể xóa chủ câu lạc bộ');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const removedMember = await this.clubMemberRepository.softDeleteMember(member.id, queryRunner);
      await queryRunner.commitTransaction();
      return removedMember as ClubMemberEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllMembersForAdmin(
    clubId: string,
    status?: 'pending' | 'active' | 'rejected' | 'inactive',
    skip: number = 0,
    take: number = 10,
  ): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const [members, total] = await this.clubMemberRepository.findAllByClubWithFilter(
      clubId,
      status,
      skip,
      take,
    );

    const data = members.map(member => ({
      id: member.id,
      userId: member.userId,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      approvedAt: member.approvedAt,
      rejectedAt: member.rejectedAt,
    }));

    return {
      data,
      total,
      skip,
      take,
    };
  }

  async forceRemoveMember(clubId: string, userId: string): Promise<void> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUserId(clubId, userId);
    if (!member) {
      throw new NotFoundException('Thành viên không tồn tại');
    }

    if (member.user.role === 'club_leader') {
      throw new BadRequestException('Không thể xóa chủ câu lạc bộ');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.clubMemberRepository.hardDeleteMember(member.id, queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
