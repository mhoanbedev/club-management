import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventTypeEntity } from '../../entities/event-type.entity';

@Injectable()
export class EventTypeRepository {
  constructor(
    @InjectRepository(EventTypeEntity)
    private repository: Repository<EventTypeEntity>,
  ) {}

  async create(clubId: string, name: string, description?: string): Promise<EventTypeEntity> {
    const eventType = this.repository.create({
      clubId,
      name,
      description,
    });
    return this.repository.save(eventType);
  }

  async findById(id: string): Promise<EventTypeEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByClubId(clubId: string): Promise<EventTypeEntity[]> {
    return this.repository.find({
      where: { clubId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByNameAndClubId(clubId: string, name: string): Promise<EventTypeEntity | null> {
    return this.repository.findOne({
      where: { clubId, name },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
