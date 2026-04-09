import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventAttendanceRepository } from '../repositories/event-attendance.repository';
import { EventRepository } from '../../event/repositories/event.repository';
import { ClubMemberRepository } from '../../club-member/repositories/club-member.repository';
import { EventRegistrationRepository } from '../../event-registration/repositories/event-registration.repository';
import { UserRepository } from '../../auth/repositories/user.repository';
import { AttendanceResponseDto, AttendanceListResponseDto } from '../dto/attendance-response.dto';
import { GenerateQrResponseDto } from '../dto/generate-qr.dto';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class EventAttendanceService {
  private qrSecret = process.env.QR_SECRET || 'your-secret-key';
  private qrValiditySeconds = 180; 
  private qrRotationSeconds = 18; 
  private activeQrCodes: Map<string, { qrData: string; expiresAt: Date; rotationInterval: NodeJS.Timeout }> = new Map();

  constructor(
    private attendanceRepository: EventAttendanceRepository,
    private eventRepository: EventRepository,
    private clubMemberRepository: ClubMemberRepository,
    private registrationRepository: EventRegistrationRepository,
  ) {}

  async generateQrCode(clubId: string, eventId: string, userId: string): Promise<GenerateQrResponseDto> {
    const clubMember = await this.clubMemberRepository.findByClubAndUser(clubId, userId);

    if (!clubMember || clubMember.role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể tạo mã QR');
    }

    const event = await this.eventRepository.findById(eventId);

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    if (event.status !== 'ongoing') {
      throw new BadRequestException('Sự kiện phải ở trạng thái diễn ra để tạo mã QR');
    }
    const existingQr = this.activeQrCodes.get(eventId);
    if (existingQr) {
      clearInterval(existingQr.rotationInterval);
    }
    const expiresAt = new Date(Date.now() + this.qrValiditySeconds * 1000);
    const initialQrData = this.generateQrData(eventId);
    const initialQrCode = await QRCode.toDataURL(initialQrData);
    const rotationInterval = setInterval(async () => {
      if (new Date() > expiresAt) {
        clearInterval(rotationInterval);
        this.activeQrCodes.delete(eventId);
        return;
      }
      const newQrData = this.generateQrData(eventId);
      const storedQr = this.activeQrCodes.get(eventId);
      if (storedQr) {
        storedQr.qrData = newQrData;
      }
    }, this.qrRotationSeconds * 1000);

    this.activeQrCodes.set(eventId, { qrData: initialQrData, expiresAt, rotationInterval });

    return { qrCode: initialQrCode, qrData: initialQrData, expiresAt };
  }

  async checkInQr(
    clubId: string,
    eventId: string,
    userId: string,
    qrCode: string,
  ): Promise<AttendanceResponseDto> {
    const event = await this.eventRepository.findById(eventId);

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    if (event.status !== 'ongoing') {
      throw new BadRequestException('Sự kiện phải ở trạng thái diễn ra để điểm danh');
    }

    const qrData = this.parseQrCode(qrCode);
    if (!qrData) {
      throw new BadRequestException('Mã QR không hợp lệ');
    }

    if (qrData.eventId !== eventId) {
      throw new BadRequestException('Mã QR không hợp lệ');
    }

    const storedQr = this.activeQrCodes.get(eventId);
    
    if (!storedQr || new Date() > storedQr.expiresAt) {
      throw new BadRequestException('Mã QR đã hết hạn');
    }

    if (storedQr.qrData !== qrCode) {
      throw new BadRequestException('Mã QR không hợp lệ');
    }

    let roleAtEvent: 'leader' | 'member' = 'member';
    const clubMember = await this.clubMemberRepository.findByClubAndUser(clubId, userId);

    if (clubMember && clubMember.role === 'leader') {
      roleAtEvent = 'leader';
    } else {
      const registration = await this.registrationRepository.findByEventAndUser(eventId, userId);

      if (!registration || registration.status !== 'approved') {
        throw new ForbiddenException('Bạn chưa được phê duyệt tham gia sự kiện này');
      }
    }

    const existing = await this.attendanceRepository.findByEventAndUser(eventId, userId);
    if (existing) {
      throw new BadRequestException('Bạn đã điểm danh cho sự kiện này rồi');
    }

    const attendance = this.attendanceRepository.create({
      eventId,
      userId,
      roleAtEvent,
      checkedInAt: new Date(),
      checkInMethod: 'qr',
      status: 'present',
    });

    await this.attendanceRepository.save(attendance);
    const savedAttendance = await this.attendanceRepository.findByEventAndUser(eventId, userId);
    return this.formatAttendanceResponse(savedAttendance);
  }

  async checkInManual(
    clubId: string,
    eventId: string,
    leaderId: string,
    targetUserId: string,
  ): Promise<AttendanceResponseDto> {
    const leader = await this.clubMemberRepository.findByClubAndUser(clubId, leaderId);

    if (!leader || leader.role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể điểm danh thủ công');
    }
    const event = await this.eventRepository.findById(eventId);

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    if (event.status !== 'ongoing') {
      throw new BadRequestException('Sự kiện phải ở trạng thái diễn ra để điểm danh');
    }
    let roleAtEvent: 'leader' | 'member' = 'member';
    const targetMember = await this.clubMemberRepository.findByClubAndUser(clubId, targetUserId);

    if (targetMember && targetMember.role === 'leader') {
      roleAtEvent = 'leader';
    } else {
      const registration = await this.registrationRepository.findByEventAndUser(eventId, targetUserId);

      if (!registration || registration.status !== 'approved') {
        throw new ForbiddenException('Người dùng chưa được phê duyệt tham gia sự kiện này');
      }
    }

    const existing = await this.attendanceRepository.findByEventAndUser(eventId, targetUserId);
    if (existing) {
      throw new BadRequestException('Người dùng đã điểm danh cho sự kiện này rồi');
    }

    const attendance = this.attendanceRepository.create({
      eventId,
      userId: targetUserId,
      roleAtEvent,
      checkedInAt: new Date(),
      checkInMethod: 'manual',
      status: 'present',
    });

    await this.attendanceRepository.save(attendance);
    
    const savedAttendance = await this.attendanceRepository.findByEventAndUser(eventId, targetUserId);
    return this.formatAttendanceResponse(savedAttendance);
  }


  async checkOut(
    clubId: string,
    eventId: string,
    leaderId: string,
    targetUserId: string,
  ): Promise<AttendanceResponseDto> {
    const leader = await this.clubMemberRepository.findByClubAndUser(clubId, leaderId);

    if (!leader || leader.role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể check-out');
    }

    const event = await this.eventRepository.findById(eventId);

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    if (event.status !== 'ongoing') {
      throw new BadRequestException('Sự kiện phải ở trạng thái diễn ra để check-out');
    }

    const attendance = await this.attendanceRepository.findByEventAndUser(eventId, targetUserId);
    if (!attendance) {
      throw new NotFoundException('Không tìm thấy bản ghi điểm danh');
    }

    if (attendance.checkedOutAt) {
      throw new BadRequestException('Người dùng đã check-out rồi');
    }

    attendance.checkedOutAt = new Date();
    attendance.checkOutMethod = 'manual';
    await this.attendanceRepository.save(attendance);

    return this.formatAttendanceResponse(attendance);
  }

  async getAttendanceList(
    clubId: string,
    eventId: string,
    userId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<AttendanceListResponseDto> {

    const leader = await this.clubMemberRepository.findByClubAndUser(clubId, userId);

    if (!leader || leader.role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể xem danh sách điểm danh');
    }

    const event = await this.eventRepository.findById(eventId);

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const [attendances, total] = await this.attendanceRepository.findByEvent(eventId, skip, take);

    return {
      data: attendances.map((a) => this.formatAttendanceResponse(a)),
      total,
      skip,
      take,
    };
  }


  async getAttendanceDetail(
    clubId: string,
    eventId: string,
    userId: string,
    targetUserId: string,
  ): Promise<AttendanceResponseDto> {
    const leader = await this.clubMemberRepository.findByClubAndUser(clubId, userId);

    if (!leader || leader.role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có thể xem chi tiết điểm danh');
    }

    const event = await this.eventRepository.findById(eventId);

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const attendance = await this.attendanceRepository.findByEventAndUserId(eventId, targetUserId);
    if (!attendance) {
      throw new NotFoundException('Không tìm thấy bản ghi điểm danh');
    }

    return this.formatAttendanceResponse(attendance);
  }


  async getMemberAttendanceList(
    userId: string,
    clubId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<AttendanceListResponseDto> {
    const member = await this.clubMemberRepository.findByClubAndUserAndStatus(
      clubId,
      userId,
      'active',
    );

    if (!member) {
      throw new ForbiddenException('Bạn không phải là thành viên hoạt động của nhóm này');
    }

    const [attendances, total] = await this.attendanceRepository.findMemberAttendanceList(
      userId,
      clubId,
      skip,
      take,
    );

    return {
      data: attendances.map((a) => this.formatAttendanceResponse(a)),
      total,
      skip,
      take,
    };
  }


  async getMemberAttendanceDetail(
    userId: string,
    clubId: string,
    eventId: string,
  ): Promise<AttendanceResponseDto> {
    const member = await this.clubMemberRepository.findByClubAndUserAndStatus(
      clubId,
      userId,
      'active',
    );

    if (!member) {
      throw new ForbiddenException('Bạn không phải là thành viên hoạt động của nhóm này');
    }

    const event = await this.eventRepository.findById(eventId);

    if (!event || event.clubId !== clubId) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const attendance = await this.attendanceRepository.findMemberAttendanceDetail(userId, eventId);
    if (!attendance) {
      throw new NotFoundException('Không tìm thấy bản ghi điểm danh');
    }

    return this.formatAttendanceResponse(attendance);
  }


  private generateQrData(eventId: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const hash = this.generateHash(eventId, timestamp);
    return `${eventId}|${timestamp}|${hash}`;
  }

  private generateHash(eventId: string, timestamp: number): string {
    const data = `${eventId}${timestamp}${this.qrSecret}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private parseQrCode(qrCode: string): { eventId: string; timestamp: number; hash: string } | null {
    try {
      const parts = qrCode.split('|');
      if (parts.length !== 3) return null;

      return {
        eventId: parts[0],
        timestamp: parseInt(parts[1], 10),
        hash: parts[2],
      };
    } catch {
      return null;
    }
  }

  private formatAttendanceResponse(attendance: any): AttendanceResponseDto {
    return {
      id: attendance.id,
      eventId: attendance.eventId,
      userId: attendance.userId,
      roleAtEvent: attendance.roleAtEvent,
      checkedInAt: attendance.checkedInAt,
      checkInMethod: attendance.checkInMethod,
      checkedOutAt: attendance.checkedOutAt,
      checkOutMethod: attendance.checkOutMethod,
      status: attendance.status,
      user: {
        id: attendance.user?.id,
        email: attendance.user?.email,
        name: attendance.user?.name,
      },
      event: {
        id: attendance.event?.id,
        name: attendance.event?.name,
        startTime: attendance.event?.startTime,
        endTime: attendance.event?.endTime,
        location: attendance.event?.location,
        type: attendance.event?.type ? {
          id: attendance.event.type.id,
          name: attendance.event.type.name,
        } : null,
      },
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
    };
  }
}
