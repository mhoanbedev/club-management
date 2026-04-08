import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveJoinDto {
  @ApiProperty({ example: 'active', enum: ['active', 'rejected'] })
  @IsEnum(['active', 'rejected'], { message: 'Trạng thái phải là active hoặc rejected' })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status: 'active' | 'rejected';
}
