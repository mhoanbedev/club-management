export class PointHistoryDto {
  id: string;
  eventId: string;
  eventName: string;
  eventStartTime: Date;
  eventEndTime: Date;
  eventLocation: string;
  eventImageUrl: string | null;
  pointsEarned: number;
  reason: 'present_leader' | 'present_member' | 'absent';
  createdAt: Date;
}

export class PointHistoryListDto {
  data: PointHistoryDto[];
  total: number;
  skip: number;
  take: number;
}
