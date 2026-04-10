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
  ): Promise<[PointHistoryEntity[], number]> {
    return this.createQueryBuilder('history')
      .leftJoinAndSelect('history.event', 'event')
      .select([
        'history.id',
        'history.clubId',
        'history.userId',
        'history.eventId',
        'history.pointsEarned',
        'history.reason',
        'history.createdAt',
        'event.id',
        'event.name',
        'event.startTime',
        'event.endTime',
        'event.location',
        'event.imageUrl',
      ])
      .where('history.clubId = :clubId', { clubId })
      .andWhere('history.userId = :userId', { userId })
      .orderBy('history.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
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
