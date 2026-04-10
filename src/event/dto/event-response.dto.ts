import { ApiProperty } from '@nestjs/swagger';

export class UserBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class EventTypeBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clubId: string;

  @ApiProperty()
  typeId: string;

  @ApiProperty()
  type: EventTypeBasicDto;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  location: string;

  @ApiProperty({ nullable: true })
  imageUrl: string;

  @ApiProperty()
  status: 'draft' | 'published' | 'ongoing' | 'finished';

  @ApiProperty({ nullable: true })
  deletedAt: Date;

  @ApiProperty({ nullable: true })
  deletedBy: UserBasicDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
