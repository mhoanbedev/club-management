import { IsString, IsUUID, IsDateString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Workshop NestJS', description: 'Tên sự kiện' })
  @IsString({ message: 'Tên sự kiện phải là chuỗi' })
  @MinLength(1, { message: 'Tên sự kiện không được rỗng' })
  @MaxLength(255, { message: 'Tên sự kiện không được vượt quá 255 ký tự' })
  name: string;

  @ApiProperty({ example: 'Học về NestJS', description: 'Mô tả sự kiện', required: false })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(1000, { message: 'Mô tả không được vượt quá 1000 ký tự' })
  description?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID loại sự kiện' })
  @IsUUID('4', { message: 'ID loại sự kiện không hợp lệ' })
  typeId: string;

  @ApiProperty({ example: '2026-04-15T10:00:00Z', description: 'Thời gian bắt đầu' })
  @IsDateString({}, { message: 'Thời gian bắt đầu không hợp lệ' })
  startTime: string;

  @ApiProperty({ example: '2026-04-15T12:00:00Z', description: 'Thời gian kết thúc' })
  @IsDateString({}, { message: 'Thời gian kết thúc không hợp lệ' })
  endTime: string;

  @ApiProperty({ example: 'Phòng 101', description: 'Địa điểm' })
  @IsString({ message: 'Địa điểm phải là chuỗi' })
  @MinLength(1, { message: 'Địa điểm không được rỗng' })
  @MaxLength(255, { message: 'Địa điểm không được vượt quá 255 ký tự' })
  location: string;
}
