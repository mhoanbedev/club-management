import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { ClubRepository } from '../../club/repositories/club.repository';
import { ClubMemberRepository } from '../../club-member/repositories/club-member.repository';
import { EventTypeRepository } from '../../event-type/repositories/event-type.repository';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventEntity } from '../../entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private clubRepository: ClubRepository,
    private clubMemberRepository: ClubMemberRepository,
    private eventTypeRepository: EventTypeRepository,
  ) {}

  async createEvent(
    clubId: string,
    createEventDto: CreateEventDto,
    leaderId: string,
  ): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUser(clubId, leaderId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể tạo sự kiện');
    }

    const eventType = await this.eventTypeRepository.findById(createEventDto.typeId);
    if (!eventType || eventType.clubId !== clubId) {
      throw new BadRequestException('Loại sự kiện không tồn tại hoặc không thuộc câu lạc bộ này');
    }

    const startTime = new Date(createEventDto.startTime);
    const endTime = new Date(createEventDto.endTime);
    const now = new Date();

    if (startTime < now) {
      throw new BadRequestException('Thời gian bắt đầu không thể trong quá khứ');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    const event = await this.eventRepository.create(
      clubId,
      createEventDto.typeId,
      createEventDto.name,
      createEventDto.description || '',
      startTime,
      endTime,
      createEventDto.location,
    );

    return this.mapEventResponse(event);
  }

  async getEventsForMembers(
    clubId: string,
    userId: string,
    skip: number = 0,
    take: number = 10,
    status?: 'published' | 'ongoing' | 'finished',
  ): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Bạn không phải là thành viên của câu lạc bộ này');
    }

    const [events, total] = await this.eventRepository.findByClubIdForMembers(
      clubId,
      skip,
      take,
      status,
    );

    return {
      data: events.map(event => this.mapEventResponse(event)),
      total,
      skip,
      take,
    };
  }

  async getEventsForAdmin(
    clubId: string,
    userId: string,
    skip: number = 0,
    take: number = 10,
    status?: 'draft' | 'published' | 'ongoing' | 'finished',
    includeDeleted: boolean = false,
  ): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể xem tất cả sự kiện');
    }

    const [events, total] = await this.eventRepository.findByClubIdForAdmin(
      clubId,
      skip,
      take,
      status,
      includeDeleted,
    );

    return {
      data: events.map(event => this.mapEventResponse(event)),
      total,
      skip,
      take,
    };
  }

  async getEventDetailForMembers(
    clubId: string,
    eventId: string,
    userId: string,
  ): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Bạn không phải là thành viên của câu lạc bộ này');
    }

    const event = await this.eventRepository.findByIdForMembers(clubId, eventId);
    if (!event) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    return this.mapEventResponse(event);
  }

  async getEventDetailForAdmin(
    clubId: string,
    eventId: string,
    userId: string,
  ): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể xem chi tiết sự kiện');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    return this.mapEventResponse(event);
  }

  async updateEvent(
    clubId: string,
    eventId: string,
    updateEventDto: UpdateEventDto,
    userId: string,
  ): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể cập nhật sự kiện');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    if (event.deletedAt) {
      throw new BadRequestException('Không thể sửa sự kiện đã bị xóa');
    }

    if (updateEventDto.typeId) {
      const eventType = await this.eventTypeRepository.findById(updateEventDto.typeId);
      if (!eventType || eventType.clubId !== clubId) {
        throw new BadRequestException('Loại sự kiện không tồn tại hoặc không thuộc câu lạc bộ này');
      }
    }

    if (updateEventDto.startTime || updateEventDto.endTime) {
      const startTime = updateEventDto.startTime ? new Date(updateEventDto.startTime) : event.startTime;
      const endTime = updateEventDto.endTime ? new Date(updateEventDto.endTime) : event.endTime;
      const now = new Date();

      if (startTime < now) {
        throw new BadRequestException('Thời gian bắt đầu không thể trong quá khứ');
      }

      if (endTime <= startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    }

    const updateData: any = {};
    if (updateEventDto.name) updateData.name = updateEventDto.name;
    if (updateEventDto.description !== undefined) updateData.description = updateEventDto.description;
    if (updateEventDto.typeId) updateData.typeId = updateEventDto.typeId;
    if (updateEventDto.startTime) updateData.startTime = new Date(updateEventDto.startTime);
    if (updateEventDto.endTime) updateData.endTime = new Date(updateEventDto.endTime);
    if (updateEventDto.location) updateData.location = updateEventDto.location;
    
    if (updateEventDto.status) {
      const now = new Date();
      const startTime = updateEventDto.startTime ? new Date(updateEventDto.startTime) : event.startTime;
      const endTime = updateEventDto.endTime ? new Date(updateEventDto.endTime) : event.endTime;

      if (updateEventDto.status === 'ongoing') {
        if (now < startTime) {
          throw new BadRequestException('Sự kiện chưa bắt đầu, không thể chuyển sang trạng thái ongoing');
        }
        if (now > endTime) {
          throw new BadRequestException('Sự kiện đã kết thúc, không thể chuyển sang trạng thái ongoing');
        }
      }

      if (updateEventDto.status === 'finished') {
        if (now < endTime) {
          throw new BadRequestException('Sự kiện chưa kết thúc, không thể chuyển sang trạng thái finished');
        }
      }

      updateData.status = updateEventDto.status;
    }

    const updatedEvent = await this.eventRepository.update(eventId, updateData);
    if (!updatedEvent) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }
    return this.mapEventResponse(updatedEvent);
  }

  async deleteEvent(clubId: string, eventId: string, userId: string): Promise<void> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

 
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể xóa sự kiện');
    }

 
    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

 
    if (event.deletedAt) {
      throw new BadRequestException('Sự kiện đã bị xóa');
    }

    await this.eventRepository.softDelete(eventId, userId);
  }

  async updateEventImage(clubId: string, eventId: string, imageUrl: string, userId: string): Promise<any> {
    const club = await this.clubRepository.findById(clubId);
    if (!club) {
      throw new NotFoundException('Câu lạc bộ không tồn tại');
    }

    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể cập nhật ảnh sự kiện');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const updatedEvent = await this.eventRepository.update(eventId, { imageUrl });
    if (!updatedEvent) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }
    return this.mapEventResponse(updatedEvent);
  }

  private mapEventResponse(event: EventEntity): any {
    return {
      id: event.id,
      clubId: event.clubId,
      typeId: event.typeId,
      type: event.type ? {
        id: event.type.id,
        name: event.type.name,
      } : null,
      name: event.name,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      imageUrl: event.imageUrl,
      status: event.status,
      deletedAt: event.deletedAt,
      deletedBy: event.deletedByUser ? {
        id: event.deletedByUser.id,
        email: event.deletedByUser.email,
        name: event.deletedByUser.name,
      } : null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
