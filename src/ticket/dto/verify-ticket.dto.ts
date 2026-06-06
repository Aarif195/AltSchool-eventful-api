import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTicketDto {
  @ApiProperty({ description: 'The complete raw QR code payload string string scanned at the gate' ,
    example: 'TKT-DEC-85721-SECURE-HASH-STRING'
  })
  @IsString()
  @IsNotEmpty()
  qrCodePayload: string;
}