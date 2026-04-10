import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MemberPointRepository } from '../repositories/member-point.repository';
import { PointHistoryRepository } from '../repositories/point-history.repository';
import { EventAttendanceRepository } from '../../event-attendance/repositories/event-attendance.repository';
import { ClubMemberRepository } from '../../club-member/repositories/club-member.repository';
import { EventRepository } from '../../event/repositories/event.repository';
import { UserEntity } from '../../entities/user.entity';
import { DataSource } from 'typeorm';
import { MemberPointEntity } from '../../entities/member-point.entity';
import { PointHistoryEntity } from '../../entities/point-history.entity';
import { PointConfigEntity } from '../../entities/point-config.entity';
import { MemberPointDto, MemberPointDetailDto } from '../dto/member-point-response.dto';
import { LeaderboardDto } from '../dto/leaderboard-response.dto';
import { PointHistoryDto, PointHistoryListDto } from '../dto/point-history-response.dto';
import { PointConfigResponseDto } from '../dto/point-config.dto';

@Injectable()
export class MemberPointService {
  constructor(
    private memberPointRepository: MemberPointRepository,
    private pointHistoryRepository: PointHistoryRepository,
    private attendanceRepository: EventAttendanceRepository,
    private clubMemberRepository: ClubMemberRepository,
    private eventRepository: EventRepository,
    private dataSource: DataSource,
  ) {}

  async addPointsForCheckIn(
    clubId: string,
    userId: string,
    eventId: string,
    roleAtEvent: 'leader' | 'member',
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(PointHistoryEntity, {
        where: { eventId, userId, clubId },
      });

      if (existing) {
        throw new BadRequestException('Đã tính điểm cho sự kiện này rồi');
      }

      const pointConfig = await queryRunner.manager.findOne(PointConfigEntity, {
        where: { clubId },
      });

      if (!pointConfig) {
        throw new NotFoundException('Cấu hình điểm không tồn tại');
      }

      const pointsEarned = this.calculatePoints(roleAtEvent, pointConfig);
      const reason = roleAtEvent === 'leader' ? 'present_leader' : 'present_member';
      const history = queryRunner.manager.create(PointHistoryEntity, {
        clubId,
        userId,
        eventId,
        pointsEarned,
        reason,
      });
      await queryRunner.manager.save(history);
      let memberPoint = await queryRunner.manager.findOne(MemberPointEntity, {
        where: { clubId, userId },
      });

      if (!memberPoint) {
        memberPoint = queryRunner.manager.create(MemberPointEntity, {
          clubId,
          userId,
          totalPoints: pointsEarned,
        });
      } else {
        memberPoint.totalPoints += pointsEarned;
      }

      await queryRunner.manager.save(memberPoint);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async recalculateUserPoints(clubId: string, userId: string): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.pointHistoryRepository.deleteByUserAndClub(clubId, userId);
      const pointConfig = await queryRunner.manager.findOne(PointConfigEntity, {
        where: { clubId },
      });

      if (!pointConfig) {
        throw new NotFoundException('Cấu hình điểm không tồn tại');
      }

      const attendances = await this.attendanceRepository.find({
        where: {
          userId,
          status: 'present',
        },
        relations: ['event'],
      });

      let totalPoints = 0;

      for (const attendance of attendances) {
        if (attendance.event.clubId !== clubId) continue;

        const pointsEarned = this.calculatePoints(attendance.roleAtEvent, pointConfig);
        const reason = attendance.roleAtEvent === 'leader' ? 'present_leader' : 'present_member';

        const history = queryRunner.manager.create(PointHistoryEntity, {
          clubId,
          userId,
          eventId: attendance.eventId,
          pointsEarned,
          reason,
        });

        await queryRunner.manager.save(history);
        totalPoints += pointsEarned;
      }

      let memberPoint = await queryRunner.manager.findOne(MemberPointEntity, {
        where: { clubId, userId },
      });

      if (!memberPoint) {
        memberPoint = queryRunner.manager.create(MemberPointEntity, {
          clubId,
          userId,
          totalPoints,
        });
      } else {
        memberPoint.totalPoints = totalPoints;
      }

      await queryRunner.manager.save(memberPoint);
      await queryRunner.commitTransaction();

      return totalPoints;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getMemberPoints(clubId: string, userId: string): Promise<MemberPointDetailDto> {
    const member = await this.clubMemberRepository.findByClubAndUserAndStatus(
      clubId,
      userId,
      'active',
    );

    if (!member) {
      throw new ForbiddenException('Bạn không phải là thành viên hoạt động của nhóm này');
    }
    let memberPoint = await this.memberPointRepository.findByClubAndUser(clubId, userId);
    
    if (!memberPoint) {
      await this.memberPointRepository.save({
        clubId,
        userId,
        totalPoints: 0,
      });
      memberPoint = await this.memberPointRepository.findByClubAndUser(clubId, userId);
    }

    if (!memberPoint) {
      throw new NotFoundException('Không thể tạo dữ liệu điểm');
    }

    const rank = await this.memberPointRepository.findRankByClubAndUser(clubId, userId);

    return {
      userId: memberPoint.user.id,
      userName: memberPoint.user.name,
      email: memberPoint.user.email,
      totalPoints: memberPoint.totalPoints,
      rank,
    };
  }

  async getLeaderboard(clubId: string, skip: number, take: number): Promise<LeaderboardDto> {
    const [memberPoints, total] = await this.memberPointRepository.findLeaderboard(
      clubId,
      skip,
      take,
    );

    const data: MemberPointDto[] = memberPoints.map((mp, index) => ({
      userId: mp.userId,
      userName: mp.userName,
      totalPoints: parseInt(mp.totalPoints) || 0,
      rank: skip + index + 1,
    }));

    return { data, total, skip, take };
  }

  async getPointHistory(
    clubId: string,
    userId: string,
    skip: number,
    take: number,
  ): Promise<PointHistoryListDto> {
    const [histories, total] = await this.pointHistoryRepository.findByUser(
      clubId,
      userId,
      skip,
      take,
    );

    const data: PointHistoryDto[] = histories.map((h) => ({
      id: h.id,
      eventId: h.eventId,
      eventName: h.event?.name || 'N/A',
      pointsEarned: h.pointsEarned,
      reason: h.reason,
      createdAt: h.createdAt,
    }));

    return { data, total, skip, take };
  }

  async getPointConfig(clubId: string): Promise<PointConfigResponseDto> {
    const config = await this.dataSource.manager.findOne(PointConfigEntity, {
      where: { clubId },
    });

    if (!config) {
      throw new NotFoundException('Cấu hình điểm không tồn tại');
    }

    return {
      leaderPoints: config.leaderPoints,
      memberPoints: config.memberPoints,
    };
  }

  async updatePointConfig(
    clubId: string,
    leaderId: string,
    leaderPoints: number,
    memberPoints: number,
  ): Promise<PointConfigResponseDto> {
    const leader = await this.clubMemberRepository.findByClubAndUser(clubId, leaderId);

    if (!leader || leader.role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể cập nhật cấu hình điểm');
    }

    let config = await this.dataSource.manager.findOne(PointConfigEntity, {
      where: { clubId },
    });

    if (!config) {
      config = this.dataSource.manager.create(PointConfigEntity, {
        clubId,
        leaderPoints,
        memberPoints,
      });
    } else {
      config.leaderPoints = leaderPoints;
      config.memberPoints = memberPoints;
    }

    await this.dataSource.manager.save(config);

    return {
      leaderPoints: config.leaderPoints,
      memberPoints: config.memberPoints,
    };
  }

  async updatePointConfigAdmin(
    clubId: string,
    adminId: string,
    leaderPoints: number,
    memberPoints: number,
  ): Promise<PointConfigResponseDto> {
    const user = await this.dataSource.manager.findOne(UserEntity, {
      where: { id: adminId } as any,
    });

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có thể cập nhật cấu hình điểm');
    }

    let config = await this.dataSource.manager.findOne(PointConfigEntity, {
      where: { clubId },
    });

    if (!config) {
      config = this.dataSource.manager.create(PointConfigEntity, {
        clubId,
        leaderPoints,
        memberPoints,
      });
    } else {
      config.leaderPoints = leaderPoints;
      config.memberPoints = memberPoints;
    }

    await this.dataSource.manager.save(config);

    return {
      leaderPoints: config.leaderPoints,
      memberPoints: config.memberPoints,
    };
  }

  async getPointConfigAdmin(clubId: string, adminId: string): Promise<PointConfigResponseDto> {
    const user = await this.dataSource.manager.findOne(UserEntity, {
      where: { id: adminId } as any,
    });

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có thể xem cấu hình điểm');
    }

    const config = await this.dataSource.manager.findOne(PointConfigEntity, {
      where: { clubId },
    });

    if (!config) {
      throw new NotFoundException('Cấu hình điểm không tồn tại');
    }

    return {
      leaderPoints: config.leaderPoints,
      memberPoints: config.memberPoints,
    };
  }

  async createDefaultPointConfig(clubId: string): Promise<void> {
    const existing = await this.dataSource.manager.findOne(PointConfigEntity, {
      where: { clubId },
    });

    if (!existing) {
      const config = this.dataSource.manager.create(PointConfigEntity, {
        clubId,
        leaderPoints: 10,
        memberPoints: 5,
      });
      await this.dataSource.manager.save(config);
    }
  }

  private calculatePoints(roleAtEvent: 'leader' | 'member', config: PointConfigEntity): number {
    return roleAtEvent === 'leader' ? config.leaderPoints : config.memberPoints;
  }
}
