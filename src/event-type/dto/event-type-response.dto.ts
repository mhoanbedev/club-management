import { ApiProperty } from '@nestjs/swagger';

export class EventTypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clubId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string;

  @ApiProperty()
  createdAt: Date;
}
