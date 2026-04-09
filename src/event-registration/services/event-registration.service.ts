import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventRegistrationRepository } from '../repositories/event-registration.repository';
import { EventRepository } from '../../event/repositories/event.repository';
import { ClubMemberRepository } from '../../club-member/repositories/club-member.repository';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { EventRegistrationEntity } from '../../entities/event-registration.entity';

@Injectable()
export class EventRegistrationService {
  constructor(
    private registrationRepository: EventRegistrationRepository,
    private eventRepository: EventRepository,
    private clubMemberRepository: ClubMemberRepository,
  ) {}

  async registerEvent(
    clubId: string,
    createRegistrationDto: CreateRegistrationDto,
    userId: string,
  ): Promise<any> {
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Bạn không phải là thành viên hoạt động của câu lạc bộ này');
    }

    const event = await this.eventRepository.findById(createRegistrationDto.eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    if (event.deletedAt) {
      throw new BadRequestException('Sự kiện đã bị xóa');
    }

    if (event.status !== 'published' && event.status !== 'ongoing') {
      throw new BadRequestException('Chỉ có thể đăng ký sự kiện ở trạng thái công bố hoặc đang diễn ra');
    }

    const existingRegistration = await this.registrationRepository.findByEventAndUser(
      createRegistrationDto.eventId,
      userId,
    );
    if (existingRegistration) {
      throw new BadRequestException('Bạn đã đăng ký sự kiện này rồi');
    }

    const registration = await this.registrationRepository.create(
      createRegistrationDto.eventId,
      userId,
    );

    return this.mapRegistrationResponse(registration);
  }

  async getRegistrationsByEvent(
    clubId: string,
    eventId: string,
    userId: string,
    skip: number = 0,
    take: number = 10,
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled',
  ): Promise<any> {
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể xem danh sách đăng ký');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const [registrations, total] = await this.registrationRepository.findByEventId(
      eventId,
      skip,
      take,
      status,
    );

    const counts = await this.registrationRepository.countByEventIdAndStatus(eventId);

    return {
      data: registrations.map(reg => this.mapRegistrationResponse(reg)),
      total,
      pending: counts.pending,
      approved: counts.approved,
      rejected: counts.rejected,
      cancelled: counts.cancelled,
      skip,
      take,
    };
  }

  async getMyRegistration(
    clubId: string,
    eventId: string,
    userId: string,
  ): Promise<any> {
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Bạn không phải là thành viên hoạt động của câu lạc bộ này');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const registration = await this.registrationRepository.findByUserAndEvent(userId, eventId);
    if (!registration) {
      throw new NotFoundException('Bạn chưa đăng ký sự kiện này');
    }

    return this.mapRegistrationResponse(registration);
  }

  async getRegistrationDetail(
    clubId: string,
    eventId: string,
    targetUserId: string,
    userId: string,
  ): Promise<any> {
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể xem chi tiết đăng ký');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const registration = await this.registrationRepository.findByUserAndEvent(targetUserId, eventId);
    if (!registration) {
      throw new NotFoundException('Đăng ký không tồn tại');
    }

    return this.mapRegistrationResponse(registration);
  }

  async approveRegistration(
    clubId: string,
    eventId: string,
    targetUserId: string,
    userId: string,
  ): Promise<any> {
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể duyệt đăng ký');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const registration = await this.registrationRepository.findByUserAndEvent(targetUserId, eventId);
    if (!registration) {
      throw new NotFoundException('Đăng ký không tồn tại');
    }

    if (registration.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể duyệt đăng ký ở trạng thái chờ duyệt');
    }

    const updated = await this.registrationRepository.updateStatus(registration.id, 'approved');
    if (!updated) {
      throw new NotFoundException('Đăng ký không tồn tại');
    }
    return this.mapRegistrationResponse(updated);
  }

  async rejectRegistration(
    clubId: string,
    eventId: string,
    targetUserId: string,
    userId: string,
  ): Promise<any> {
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.role !== 'leader') {
      throw new ForbiddenException('Chỉ leader của câu lạc bộ mới có thể từ chối đăng ký');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const registration = await this.registrationRepository.findByUserAndEvent(targetUserId, eventId);
    if (!registration) {
      throw new NotFoundException('Đăng ký không tồn tại');
    }

    if (registration.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể từ chối đăng ký ở trạng thái chờ duyệt');
    }

    const updated = await this.registrationRepository.updateStatus(registration.id, 'rejected');
    if (!updated) {
      throw new NotFoundException('Đăng ký không tồn tại');
    }
    return this.mapRegistrationResponse(updated);
  }

  async cancelRegistration(
    clubId: string,
    eventId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.clubMemberRepository.findByClubAndUser(clubId, userId);
    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Bạn không phải là thành viên hoạt động của câu lạc bộ này');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const registration = await this.registrationRepository.findByUserAndEvent(userId, eventId);
    if (!registration) {
      throw new NotFoundException('Bạn chưa đăng ký sự kiện này');
    }

    if (registration.status === 'cancelled') {
      throw new BadRequestException('Đăng ký đã bị hủy');
    }

    await this.registrationRepository.updateStatus(registration.id, 'cancelled');
  }

  private mapRegistrationResponse(registration: EventRegistrationEntity): any {
    return {
      id: registration.id,
      eventId: registration.eventId,
      userId: registration.userId,
      event: registration.event ? {
        id: registration.event.id,
        name: registration.event.name,
        startTime: registration.event.startTime,
        endTime: registration.event.endTime,
      } : null,
      user: registration.user ? {
        id: registration.user.id,
        email: registration.user.email,
        name: registration.user.name,
      } : null,
      status: registration.status,
      registeredAt: registration.registeredAt,
      approvedAt: registration.approvedAt,
      rejectedAt: registration.rejectedAt,
      cancelledAt: registration.cancelledAt,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
    };
  }
}
