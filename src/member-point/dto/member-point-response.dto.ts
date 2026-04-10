export class MemberPointDto {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  totalPoints: number;
  rank: number;
}

export class MemberPointDetailDto {
  userId: string;
  userName: string;
  email: string;
  avatarUrl: string | null;
  totalPoints: number;
  rank: number;
}
