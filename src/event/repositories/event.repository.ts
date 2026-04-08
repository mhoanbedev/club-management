import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from '../../entities/event.entity';

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(EventEntity)
    private repository: Repository<EventEntity>,
  ) {}

  async create(
    clubId: string,
    typeId: string,
    name: string,
    description: string,
    startTime: Date,
    endTime: Date,
    location: string,
  ): Promise<EventEntity> {
    const event = this.repository.create({
      clubId,
      typeId,
      name,
      description,
      startTime,
      endTime,
      location,
      status: 'draft',
    });
    return this.repository.save(event);
  }

  async findById(id: string): Promise<EventEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['type', 'deletedByUser'],
    });
  }

  async findByClubIdForMembers(
    clubId: string,
    skip: number = 0,
    take: number = 10,
    status?: 'published' | 'ongoing' | 'finished',
  ): Promise<[EventEntity[], number]> {
    const query = this.repository
      .createQueryBuilder('event')
      .where('event.clubId = :clubId', { clubId })
      .andWhere('event.deletedAt IS NULL')
      .andWhere('event.status IN (:...statuses)', { statuses: ['published', 'ongoing', 'finished'] })
      .leftJoinAndSelect('event.type', 'type')
      .orderBy('event.startTime', 'ASC');

    if (status) {
      query.andWhere('event.status = :status', { status });
    }

    return query.skip(skip).take(take).getManyAndCount();
  }

  async findByClubIdForAdmin(
    clubId: string,
    skip: number = 0,
    take: number = 10,
    status?: 'draft' | 'published' | 'ongoing' | 'finished',
    includeDeleted: boolean = false,
  ): Promise<[EventEntity[], number]> {
    const query = this.repository
      .createQueryBuilder('event')
      .where('event.clubId = :clubId', { clubId })
      .leftJoinAndSelect('event.type', 'type')
      .leftJoinAndSelect('event.deletedByUser', 'deletedByUser')
      .orderBy('event.startTime', 'ASC');

    if (!includeDeleted) {
      query.andWhere('event.deletedAt IS NULL');
    }

    if (status) {
      query.andWhere('event.status = :status', { status });
    }

    return query.skip(skip).take(take).getManyAndCount();
  }

  async findByIdForMembers(clubId: string, id: string): Promise<EventEntity | null> {
    return this.repository
      .createQueryBuilder('event')
      .where('event.id = :id', { id })
      .andWhere('event.clubId = :clubId', { clubId })
      .andWhere('event.deletedAt IS NULL')
      .andWhere('event.status IN (:...statuses)', { statuses: ['published', 'ongoing', 'finished'] })
      .leftJoinAndSelect('event.type', 'type')
      .leftJoinAndSelect('event.deletedByUser', 'deletedByUser')
      .getOne();
  }

  async update(
    id: string,
    data: Partial<EventEntity>,
  ): Promise<EventEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repository.update(id, {
      deletedAt: new Date(),
      deletedBy,
    });
  }

  async findByStatus(status: 'draft' | 'published' | 'ongoing' | 'finished'): Promise<any[]> {
    return this.repository.find({
      where: {
        status,
        deletedAt: null as any,
      },
    });
  }
}
