import { Exclude } from 'class-transformer';

export class AttendanceResponseDto {
  id: string;
  eventId: string;
  userId: string;
  roleAtEvent: 'leader' | 'member';
  checkedInAt: Date;
  checkInMethod: 'qr' | 'manual';
  checkedOutAt: Date;
  checkOutMethod: 'qr' | 'manual';
  status: 'present' | 'absent';
  user: {
    id: string;
    email: string;
    name: string;
  };
  event: {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    location: string;
    type: {
      id: string;
      name: string;
    } | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class AttendanceListResponseDto {
  data: AttendanceResponseDto[];
  total: number;
  skip: number;
  take: number;
}
