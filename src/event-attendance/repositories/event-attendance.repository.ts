import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventAttendanceEntity } from '../../entities/event-attendance.entity';

@Injectable()
export class EventAttendanceRepository extends Repository<EventAttendanceEntity> {
  constructor(private dataSource: DataSource) {
    super(EventAttendanceEntity, dataSource.createEntityManager());
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventAttendanceEntity | null> {
    return this.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.event', 'event')
      .leftJoinAndSelect('event.type', 'type')
      .select([
        'attendance.id',
        'attendance.eventId',
        'attendance.userId',
        'attendance.roleAtEvent',
        'attendance.checkedInAt',
        'attendance.checkInMethod',
        'attendance.checkedOutAt',
        'attendance.checkOutMethod',
        'attendance.status',
        'attendance.createdAt',
        'attendance.updatedAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
        'event.id',
        'event.name',
        'event.startTime',
        'event.endTime',
        'event.location',
        'event.imageUrl',
        'type.id',
        'type.name',
      ])
      .where('attendance.eventId = :eventId', { eventId })
      .andWhere('attendance.userId = :userId', { userId })
      .getOne();
  }

  async findByEvent(
    eventId: string,
    skip: number,
    take: number,
  ): Promise<[EventAttendanceEntity[], number]> {
    return this.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.event', 'event')
      .leftJoinAndSelect('event.type', 'type')
      .select([
        'attendance.id',
        'attendance.eventId',
        'attendance.userId',
        'attendance.roleAtEvent',
        'attendance.checkedInAt',
        'attendance.checkInMethod',
        'attendance.checkedOutAt',
        'attendance.checkOutMethod',
        'attendance.status',
        'attendance.createdAt',
        'attendance.updatedAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
        'event.id',
        'event.name',
        'event.startTime',
        'event.endTime',
        'event.location',
        'event.imageUrl',
        'type.id',
        'type.name',
      ])
      .where('attendance.eventId = :eventId', { eventId })
      .skip(skip)
      .take(take)
      .orderBy('attendance.createdAt', 'DESC')
      .getManyAndCount();
  }

  async findByEventAndUserId(
    eventId: string,
    userId: string,
  ): Promise<EventAttendanceEntity | null> {
    return this.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.event', 'event')
      .leftJoinAndSelect('event.type', 'type')
      .select([
        'attendance.id',
        'attendance.eventId',
        'attendance.userId',
        'attendance.roleAtEvent',
        'attendance.checkedInAt',
        'attendance.checkInMethod',
        'attendance.checkedOutAt',
        'attendance.checkOutMethod',
        'attendance.status',
        'attendance.createdAt',
        'attendance.updatedAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
        'event.id',
        'event.name',
        'event.startTime',
        'event.endTime',
        'event.location',
        'event.imageUrl',
        'type.id',
        'type.name',
      ])
      .where('attendance.eventId = :eventId', { eventId })
      .andWhere('attendance.userId = :userId', { userId })
      .getOne();
  }

  async findMemberAttendanceList(
    userId: string,
    clubId: string,
    skip: number,
    take: number,
  ): Promise<[EventAttendanceEntity[], number]> {
    return this.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.event', 'event')
      .leftJoinAndSelect('event.type', 'type')
      .select([
        'attendance.id',
        'attendance.eventId',
        'attendance.userId',
        'attendance.roleAtEvent',
        'attendance.checkedInAt',
        'attendance.checkInMethod',
        'attendance.checkedOutAt',
        'attendance.checkOutMethod',
        'attendance.status',
        'attendance.createdAt',
        'attendance.updatedAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
        'event.id',
        'event.name',
        'event.startTime',
        'event.endTime',
        'event.location',
        'event.imageUrl',
        'type.id',
        'type.name',
      ])
      .where('attendance.userId = :userId', { userId })
      .andWhere('event.clubId = :clubId', { clubId })
      .skip(skip)
      .take(take)
      .orderBy('attendance.createdAt', 'DESC')
      .getManyAndCount();
  }

  async findMemberAttendanceDetail(
    userId: string,
    eventId: string,
  ): Promise<EventAttendanceEntity | null> {
    return this.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.event', 'event')
      .leftJoinAndSelect('event.type', 'type')
      .select([
        'attendance.id',
        'attendance.eventId',
        'attendance.userId',
        'attendance.roleAtEvent',
        'attendance.checkedInAt',
        'attendance.checkInMethod',
        'attendance.checkedOutAt',
        'attendance.checkOutMethod',
        'attendance.status',
        'attendance.createdAt',
        'attendance.updatedAt',
        'user.id',
        'user.name',
        'user.email',
        'user.avatarUrl',
        'event.id',
        'event.name',
        'event.startTime',
        'event.endTime',
        'event.location',
        'event.imageUrl',
        'type.id',
        'type.name',
      ])
      .where('attendance.userId = :userId', { userId })
      .andWhere('attendance.eventId = :eventId', { eventId })
      .getOne();
  }
}
