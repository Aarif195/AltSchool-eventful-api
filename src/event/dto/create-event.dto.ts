import { IsNotEmpty, IsString, IsDateString, IsNumber, IsPositive, Min, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  ticketPrice: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  totalCapacity: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  creatorReminderDays?: number;
}