import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { PaginationQueryDto } from 'src/dto/pagination.dto';

@Injectable()
export class EventService {
    constructor(private readonly prisma: PrismaService) { }

    // Create a new event
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

    //  Find all events created by the creator with pagination
    async findAllEvents(paginationQuery: PaginationQueryDto) {
        const { page = 1, limit = 10 } = paginationQuery;
        const skip = (page - 1) * limit;


        const [totalItems, data] = await this.prisma.$transaction([
            this.prisma.event.count({
                where: {
                    eventDate: {
                        gt: new Date(), // Only count upcoming events
                    },
                },
            }),
            this.prisma.event.findMany({
                where: {
                    eventDate: {
                        gt: new Date(), // Only fetch upcoming events
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            statusCode: 200,
            data,
            meta: {
                totalItems,
                itemCount: data.length,
                itemsPerPage: limit,
                totalPages,
                currentPage: page,
            },
        };
    }


    // Find the details of a single event using its ID, and include the event creator’s information.
    async findCreatorEvents(creatorId: string, paginationQuery: PaginationQueryDto) {


        const { page = 1, limit = 10 } = paginationQuery;
        const skip = (page - 1) * limit;

        const [totalItems, data] = await this.prisma.$transaction([
            this.prisma.event.count({ where: { creatorId } }),
            this.prisma.event.findMany({
                where: { creatorId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            statusCode: 200,
            data,
            meta: {
                totalItems,
                itemCount: data.length,
                itemsPerPage: limit,
                totalPages,
                currentPage: page,
            },
        };
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