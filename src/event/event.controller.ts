import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { Public } from '../auth/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PaginationQueryDto } from 'src/dto/pagination.dto';


@Controller('events')
export class EventController {
    constructor(private readonly eventService: EventService) { }

// Create event
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Post()
    @Roles(Role.CREATOR)
    @ApiOperation({ summary: 'Create a new event' })
    @ApiBody({ type: CreateEventDto })
    @ApiCreatedResponse({
        description: 'Event created successfully.',
        schema: {
            example: {
                statusCode: 201,
                message: 'Event created successfully',
                data: {
                    id: 'event_uuid_123',
                    title: 'Tech Innovators Summit 2026',
                    description: 'A gathering of tech pioneers...',
                    location: 'Lagos Landmark Centre, Nigeria',
                    eventDate: '2026-08-15T10:00:00.000Z',
                    ticketPrice: 15000.00,
                    totalCapacity: 500,
                    creatorId: 'user_uuid_999',
                    createdAt: '2026-06-06T12:00:00.000Z'
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Validation error / Invalid body structural fields.',
        schema: {
            example: {
                statusCode: 400,
                message: ['ticketPrice must be a positive number'],
                error: 'Bad Request'
            }
        }
    })
    @ApiUnauthorizedResponse({
        description: 'Missing or malformed JWT token in auth header.',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized access token'
            }
        }
    })
    @ApiForbiddenResponse({
        description: 'User accounts without CREATOR role permissions cannot call this endpoint.',
        schema: {
            example: {
                statusCode: 403,
                message: 'Forbidden resource: Requires CREATOR role',
                error: 'Forbidden'
            }
        }
    })
    async create(@Body() dto: CreateEventDto, @GetUser('id') creatorId: string) {
        return this.eventService.createEvent(dto, creatorId);
    }

    // Get all events created by the creator
    // Accessible to all authenticated or unauthenticated users to explore
    @Public() 
    @Throttle({ default: { limit: 6, ttl: 60000 } })
    @Get()
    @ApiOperation({ summary: 'Get all upcoming events' })
    @ApiOkResponse({
    description: 'Successfully retrieved paginated list of upcoming events.',
    schema: {
      example: {
        statusCode: 200,
        data: [
          {
            id: 'event_uuid_123',
            title: 'Tech Innovators Summit 2026',
            description: 'A gathering of tech pioneers...',
            location: 'Lagos Landmark Centre, Nigeria',
            eventDate: '2026-08-15T10:00:00.000Z',
            ticketPrice: 15000.00,
            totalCapacity: 500,
            availableTickets: 450,
            creatorId: 'user_uuid_999',
            createdAt: '2026-06-06T12:00:00.000Z'
          }
        ],
        meta: {
          totalItems: 45,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 5,
          currentPage: 1
        }
      }
    }
  })
   async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.eventService.findAllEvents(paginationQuery);
  }

    // Get all events created by the logged in creator
    @Throttle({ default: { limit: 6, ttl: 60000 } })
    @Get('creator/my-events')
    @Roles(Role.CREATOR)
    @ApiOperation({ summary: 'Get all events created by the logged in creator' })
   @ApiOkResponse({
    description: 'Successfully retrieved paginated list of events created by the creator.',
    schema: {
      example: {
        statusCode: 200,
        data: [
          {
            id: 'event_uuid_123',
            title: 'Tech Innovators Summit 2026',
            description: 'A gathering of tech pioneers...',
            location: 'Lagos Landmark Centre, Nigeria',
            eventDate: '2026-08-15T10:00:00.000Z',
            ticketPrice: 15000.00,
            totalCapacity: 500,
            availableTickets: 450,
            creatorId: 'user_uuid_999',
            createdAt: '2026-06-06T12:00:00.000Z'
          }
        ],
        meta: {
          totalItems: 12,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 2,
          currentPage: 1
        }
      }
    }
  })
    @ApiUnauthorizedResponse({
        description: 'Missing or malformed JWT token in auth header.',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized access token'
            }
        }
    })
    @ApiForbiddenResponse({
        description: 'User accounts without CREATOR role permissions cannot call this endpoint.',
        schema: {
            example: {
                statusCode: 403,
                message: 'Forbidden resource: Requires CREATOR role',
                error: 'Forbidden'
            }
        }
    })
   async findMyEvents(
  @GetUser('id') creatorId: string,
  @Query() paginationQuery: PaginationQueryDto
) {
  return this.eventService.findCreatorEvents(creatorId, paginationQuery);
}
}
