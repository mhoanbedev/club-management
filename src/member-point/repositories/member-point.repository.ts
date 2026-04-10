import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MemberPointEntity } from '../../entities/member-point.entity';

@Injectable()
export class MemberPointRepository extends Repository<MemberPointEntity> {
  constructor(private dataSource: DataSource) {
    super(MemberPointEntity, dataSource.createEntityManager());
  }

  async findByClubAndUser(
    clubId: string,
    userId: string,
  ): Promise<MemberPointEntity | null> {
    return this.createQueryBuilder('point')
      .leftJoinAndSelect('point.user', 'user')
      .select([
        'point.id',
        'point.clubId',
        'point.userId',
        'point.totalPoints',
        'point.createdAt',
        'point.updatedAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
      ])
      .where('point.clubId = :clubId', { clubId })
      .andWhere('point.userId = :userId', { userId })
      .getOne();
  }

  async findLeaderboard(
    clubId: string,
    skip: number,
    take: number,
  ): Promise<[any[], number]> {
    const query = this.dataSource
      .createQueryBuilder()
      .select('cm.userId', 'userId')
      .addSelect('u.name', 'userName')
      .addSelect('u.email', 'email')
      .addSelect('u."avatarUrl"', 'avatarUrl')
      .addSelect('COALESCE(mp."totalPoints", 0)::integer', 'totalPoints')
      .from('club_members', 'cm')
      .leftJoin('member_points', 'mp', 'mp.userId = cm.userId AND mp.clubId = :clubId', { clubId })
      .leftJoin('users', 'u', 'u.id = cm.userId')
      .where('cm.clubId = :clubId', { clubId })
      .andWhere('cm.status = :status', { status: 'active' })
      .orderBy('COALESCE(mp."totalPoints", 0)', 'DESC')
      .addOrderBy('u.name', 'ASC');

    const total = await query.getCount();
    const data = await query.skip(skip).take(take).getRawMany();

    return [data, total];
  }

  async findRankByClubAndUser(
    clubId: string,
    userId: string,
  ): Promise<number> {
    const userPoints = await this.dataSource
      .createQueryBuilder()
      .select('COALESCE(mp."totalPoints", 0)::integer', 'totalPoints')
      .from('member_points', 'mp')
      .where('mp."clubId" = :clubId', { clubId })
      .andWhere('mp."userId" = :userId', { userId })
      .getRawOne();

    const userTotalPoints = parseInt(userPoints?.totalPoints || 0, 10);
    const result = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(DISTINCT cm."userId")::integer', 'rank')
      .from('club_members', 'cm')
      .leftJoin('member_points', 'mp', 'mp."userId" = cm."userId" AND mp."clubId" = cm."clubId"')
      .where('cm."clubId" = :clubId', { clubId })
      .andWhere('cm.status = :status', { status: 'active' })
      .andWhere('COALESCE(mp."totalPoints", 0) > :userTotalPoints', { userTotalPoints })
      .getRawOne();

    return parseInt(result?.rank || 0, 10) + 1;
  }
}
