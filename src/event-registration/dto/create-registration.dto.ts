import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID sự kiện' })
  @IsUUID('4', { message: 'ID sự kiện không hợp lệ' })
  eventId: string;
}
