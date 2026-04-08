import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeRoleDto {
  @ApiProperty({
    enum: ['leader', 'member'],
    example: 'leader',
    description: 'Vai trò mới: leader hoặc member',
  })
  @IsEnum(['leader', 'member'], { message: 'Role phải là leader hoặc member' })
  role: 'leader' | 'member';
}
