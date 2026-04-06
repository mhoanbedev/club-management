import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClubDto {
  @ApiProperty({ example: 'Câu lạc bộ Lập trình', required: false })
  @IsString()
  @IsOptional()
  @Length(3, 255, { message: 'Tên câu lạc bộ phải từ 3 đến 255 ký tự' })
  name?: string;

  @ApiProperty({ example: 'Mô tả mới', required: false })
  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Mô tả không được vượt quá 1000 ký tự' })
  description?: string;
}
