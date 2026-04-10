import { ApiProperty } from '@nestjs/swagger';

export class ClubResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  leaderId: string;

  @ApiProperty()
  status: 'pending' | 'active' | 'inactive';

  @ApiProperty({ required: false, nullable: true })
  imageUrl?: string;

  @ApiProperty({ type: [String], required: false, nullable: true, description: 'Album ảnh kỉ niệm (tối đa 10 ảnh)' })
  gallery?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
