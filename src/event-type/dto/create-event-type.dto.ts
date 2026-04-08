import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventTypeDto {
  @ApiProperty({ example: 'Workshop', description: 'Tên loại sự kiện' })
  @IsString({ message: 'Tên loại sự kiện phải là chuỗi' })
  @MinLength(1, { message: 'Tên loại sự kiện không được rỗng' })
  @MaxLength(100, { message: 'Tên loại sự kiện không được vượt quá 100 ký tự' })
  name: string;

  @ApiProperty({ example: 'Sự kiện workshop', description: 'Mô tả loại sự kiện', required: false })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;
}
