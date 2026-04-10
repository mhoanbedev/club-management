import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PointHistoryEntity } from '../../entities/point-history.entity';

@Injectable()
export class PointHistoryRepository extends Repository<PointHistoryEntity> {
  constructor(private dataSource: DataSource) {
    super(PointHistoryEntity, dataSource.createEntityManager());
  }

  async findByUser(
    clubId: string,
    userId: string,
    skip: number,
    take: number,
  ): Promise<[any[], number]> {
    const countQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('point_histories', 'ph')
      .where('ph."clubId" = :clubId', { clubId })
      .andWhere('ph."userId" = :userId', { userId });

    const countResult = await countQuery.getRawOne();
    const total = parseInt(countResult?.count || 0, 10);

    const query = this.dataSource
      .createQueryBuilder()
      .select('ph.id', 'id')
      .addSelect('ph."clubId"', 'clubId')
      .addSelect('ph."userId"', 'userId')
      .addSelect('ph."eventId"', 'eventId')
      .addSelect('ph."pointsEarned"', 'pointsEarned')
      .addSelect('ph.reason', 'reason')
      .addSelect('ph."createdAt"', 'createdAt')
      .addSelect('e.id', 'eventId_e')
      .addSelect('e.name', 'eventName')
      .addSelect('e."startTime"', 'eventStartTime')
      .addSelect('e."endTime"', 'eventEndTime')
      .addSelect('e.location', 'eventLocation')
      .addSelect('e."imageUrl"', 'eventImageUrl')
      .addSelect('ea."checkedInAt"', 'checkedInAt')
      .addSelect('ea."checkedOutAt"', 'checkedOutAt')
      .from('point_histories', 'ph')
      .leftJoin('events', 'e', 'e.id = ph."eventId"')
      .leftJoin('event_attendance', 'ea', 'ea."eventId" = ph."eventId" AND ea."userId" = ph."userId"')
      .where('ph."clubId" = :clubId', { clubId })
      .andWhere('ph."userId" = :userId', { userId })
      .orderBy('ph."createdAt"', 'DESC')
      .skip(skip)
      .take(take);

    const data = await query.getRawMany();

    return [data, total];
  }

  async deleteByUserAndClub(clubId: string, userId: string): Promise<void> {
    await this.createQueryBuilder()
      .delete()
      .where('clubId = :clubId', { clubId })
      .andWhere('userId = :userId', { userId })
      .execute();
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<PointHistoryEntity | null> {
    return this.createQueryBuilder('history')
      .where('history.eventId = :eventId', { eventId })
      .andWhere('history.userId = :userId', { userId })
      .getOne();
  }
}
