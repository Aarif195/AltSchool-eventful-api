import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(dto: CreateEventDto, creatorId: string) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        eventDate: new Date(dto.eventDate),
        ticketPrice: dto.ticketPrice,
        totalCapacity: dto.totalCapacity,
        availableTickets: dto.totalCapacity,
        creatorId: creatorId,
        creatorReminderDays: dto.creatorReminderDays || null,
      },
    });
  }

  async findAllEvents() {
    return this.prisma.event.findMany({
      where: {
        eventDate: {
          gt: new Date(), // Only fetch upcoming events
        },
      },
      orderBy: { eventDate: 'asc' },
    });
  }

  async findCreatorEvents(creatorId: string) {
    return this.prisma.event.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }
}