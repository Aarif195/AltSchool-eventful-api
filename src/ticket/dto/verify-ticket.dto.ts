import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTicketDto {
  @ApiProperty({ description: 'The complete raw QR code payload string string scanned at the gate' })
  @IsString()
  @IsNotEmpty()
  qrCodePayload: string;
}