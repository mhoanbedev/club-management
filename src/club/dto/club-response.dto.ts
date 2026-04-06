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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
