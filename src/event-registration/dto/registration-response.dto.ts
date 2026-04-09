import { ApiProperty } from '@nestjs/swagger';

export class UserBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class EventBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;
}

export class RegistrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  event: EventBasicDto;

  @ApiProperty()
  user: UserBasicDto;

  @ApiProperty()
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';

  @ApiProperty()
  registeredAt: Date;

  @ApiProperty({ nullable: true })
  approvedAt: Date;

  @ApiProperty({ nullable: true })
  rejectedAt: Date;

  @ApiProperty({ nullable: true })
  cancelledAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
