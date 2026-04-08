import { ApiProperty } from '@nestjs/swagger';

export class JoinClubDto {
}

export class ClubMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clubId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  role: 'leader' | 'member';

  @ApiProperty()
  status: 'pending' | 'active' | 'rejected' | 'inactive';

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ nullable: true })
  approvedAt: Date;

  @ApiProperty({ nullable: true })
  rejectedAt: Date;
}

export class UserBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class ClubBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}

export class ClubMemberListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  user: UserBasicDto;

  @ApiProperty()
  role: 'leader' | 'member';

  @ApiProperty()
  status: 'pending' | 'active' | 'rejected' | 'inactive';

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ nullable: true })
  approvedAt: Date;
}

export class ClubMemberDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  user: UserBasicDto;

  @ApiProperty()
  clubId: string;

  @ApiProperty()
  club: ClubBasicDto;

  @ApiProperty()
  role: 'leader' | 'member';

  @ApiProperty()
  status: 'pending' | 'active' | 'rejected' | 'inactive';

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ nullable: true })
  approvedAt: Date;

  @ApiProperty({ nullable: true })
  rejectedAt: Date;
}
