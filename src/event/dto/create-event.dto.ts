import { IsNotEmpty, IsString, IsDateString, IsNumber, IsPositive, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ 
    description: 'The title or name of the event', 
    example: 'Tech Innovators Summit 2026' 
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    description: 'A detailed description of what the event is about', 
    example: 'A gathering of tech pioneers discussing the future of decentralized computing.' 
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'The physical address or venue name where the event will take place', 
    example: 'Eko Atlantic Convention Center, Lagos' 
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ 
    description: 'The date and time when the event will start', 
    example: '2026-12-20T18:00:00Z' 
  })
  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @ApiProperty({ 
    description: 'The price of a single ticket for the event',
    example: 500.00 
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  ticketPrice: number;

    @ApiProperty({ 
    description: 'The maximum number of tickets that can be sold for the event',
    example: 500 
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  totalCapacity: number;

  @ApiPropertyOptional({ 
    description: 'Number of days before the event to trigger an automated reminder for the creator', 
    example: 3 
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  creatorReminderDays?: number;
}