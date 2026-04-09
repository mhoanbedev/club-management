import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistrationEntity } from '../../entities/event-registration.entity';

@Injectable()
export class EventRegistrationRepository {
  constructor(
    @InjectRepository(EventRegistrationEntity)
    private repository: Repository<EventRegistrationEntity>,
  ) {}

  async create(
    eventId: string,
    userId: string,
  ): Promise<EventRegistrationEntity> {
    const registration = this.repository.create({
      eventId,
      userId,
      status: 'pending',
      registeredAt: new Date(),
    });
    return this.repository.save(registration);
  }

  async findById(id: string): Promise<EventRegistrationEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['event', 'user'],
    });
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<EventRegistrationEntity | null> {
    return this.repository.findOne({
      where: { eventId, userId },
      relations: ['event', 'user'],
    });
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<EventRegistrationEntity | null> {
    return this.repository.findOne({
      where: { userId, eventId },
      relations: ['event', 'user'],
    });
  }

  async findByEventId(
    eventId: string,
    skip: number = 0,
    take: number = 10,
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled',
  ): Promise<[EventRegistrationEntity[], number]> {
    const query = this.repository
      .createQueryBuilder('registration')
      .where('registration.eventId = :eventId', { eventId })
      .leftJoinAndSelect('registration.user', 'user')
      .leftJoinAndSelect('registration.event', 'event')
      .orderBy('registration.registeredAt', 'DESC');

    if (status) {
      query.andWhere('registration.status = :status', { status });
    }

    return query.skip(skip).take(take).getManyAndCount();
  }

  async countByEventIdAndStatus(eventId: string): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('registration')
      .where('registration.eventId = :eventId', { eventId })
      .select('registration.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('registration.status')
      .getRawMany();

    const counts = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    for (const row of result) {
      counts[row.status] = parseInt(row.count, 10);
      counts.total += parseInt(row.count, 10);
    }

    return counts;
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  ): Promise<EventRegistrationEntity | null> {
    const updateData: any = { status };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
