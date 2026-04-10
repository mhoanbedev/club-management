import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PointConfigDto {
  @ApiProperty({
    description: 'Điểm cho trưởng nhóm',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  leaderPoints: number;

  @ApiProperty({
    description: 'Điểm cho thành viên',
    example: 5,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  memberPoints: number;
}

export class PointConfigResponseDto {
  leaderPoints: number;
  memberPoints: number;
}
