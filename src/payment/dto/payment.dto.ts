import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'a5c8df41-1191-4e7d-965b-bf4e5659828d', description: 'The unique ID of the event' })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}

export class PaymentIntentResponseDto {
  @ApiProperty()
  authorization_url: string;

  @ApiProperty()
  reference: string;
}