import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInQrDto {
  @ApiProperty({
    description: 'Dữ liệu QR (eventId|timestamp|hash) từ API tạo mã QR',
    example: '550e8400-e29b-41d4-a716-446655440000|1712761447|abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}
