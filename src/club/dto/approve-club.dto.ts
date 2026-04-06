import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveClubDto {
  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'], { message: 'Trạng thái phải là active hoặc inactive' })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status: 'active' | 'inactive';
}
