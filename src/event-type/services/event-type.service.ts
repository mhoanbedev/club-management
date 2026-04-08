import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventTypeRepository } from '../repositories/event-type.repository';
import { ClubRepository } from '../../club/repositories/club.repository';
import { ClubMemberRepository } from '../../club-member/repositories/club-member.repository';
import { CreateEventTypeDto } from '../dto/create-event-type.dto';
import { EventTypeEntity } from '../../entities/event-type.entity';

@Injectable()
export class EventTypeService {
  constructor(
    private eventTypeRepository: EventTypeRepository,
    private clubRepository: ClubRepository,
    private clubMemberRepository: ClubMemberRepository,
  ) {}

  async createEventType(
    clubId: string,
    leaderId: string,
    createEventTypeDto: CreateEventTypeDto,
  ): Promise<EventTypeEntity> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const leaderMember = await this.clubMemberRepository.findActiveByClubAndUser(clubId, leaderId);
    if (!leaderMember || leaderMember.role !== 'leader') {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền tạo loại sự kiện');
    }

    const existingType = await this.eventTypeRepository.findByNameAndClubId(clubId, createEventTypeDto.name);
    if (existingType) {
      throw new BadRequestException('Loại sự kiện này đã tồn tại trong câu lạc bộ');
    }

    return this.eventTypeRepository.create(clubId, createEventTypeDto.name, createEventTypeDto.description);
  }

  async getEventTypes(clubId: string): Promise<EventTypeEntity[]> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    return this.eventTypeRepository.findByClubId(clubId);
  }

  async deleteEventType(clubId: string, typeId: string, leaderId: string): Promise<void> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const leaderMember = await this.clubMemberRepository.findActiveByClubAndUser(clubId, leaderId);
    if (!leaderMember || leaderMember.role !== 'leader') {
      throw new ForbiddenException('Chỉ chủ câu lạc bộ mới có quyền xóa loại sự kiện');
    }

    const eventType = await this.eventTypeRepository.findById(typeId);
    if (!eventType) {
      throw new NotFoundException('Loại sự kiện không tồn tại');
    }

    if (eventType.clubId !== clubId) {
      throw new BadRequestException('Loại sự kiện không thuộc câu lạc bộ này');
    }

    await this.eventTypeRepository.delete(typeId);
  }
}
