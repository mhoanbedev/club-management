import { MemberPointDto } from './member-point-response.dto';

export class LeaderboardDto {
  data: MemberPointDto[];
  total: number;
  skip: number;
  take: number;
}
