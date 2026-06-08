import { Controller, Post, Get, Body, Query, Param, ParseUUIDPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProduces,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../decorators/get-user.decorator';
import { Public } from '../decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { PaginationQueryDto } from 'src/dto/pagination.dto';

@ApiTags('Event')
@Controller('events')

export class EventController {
  constructor(private readonly eventService: EventService) { }

  // Create event
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post()
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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


// getShareMetadata
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Public()
  @Get(':id/share')
  @ApiOperation({ summary: 'Retrieve dynamic HTML OpenGraph metadata tags for social media platform link sharing' })
  @ApiParam({
    name: 'id',
    description: 'The unique system structural UUID of the target event entry resource matching dataset records',
    type: String,
    example: 'a5c8df41-1191-4e7d-965b-bf4e5659828d'
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'HTML metadata template compilation parsed successfully with active social graph headers.',
    schema: {
      type: 'string',
      example: '<!DOCTYPE html><html><head><meta property="og:title" content="Tech Summit"...'
    }
  })
  @ApiNotFoundResponse({
    description: 'The requested event ID could not be identified inside the database mapping infrastructure.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Event with ID a5c8df41-1191-4e7d-965b-bf4e5659828d not found',
        error: 'Not Found'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'The passed structural query parameters fail string context validation requirements.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request'
      }
    }
  })
  async getShareMetadata(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const event = await this.eventService.findOneEvent(id); 
    
    const htmlMetadata = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${event.title}</title>
        <meta name="description" content="${event.description}">
        <meta property="og:title" content="${event.title}">
        <meta property="og:description" content="${event.description}">
        <meta property="og:type" content="event">
        <meta property="og:url" content="https://eventful.platform/events/${event.id}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${event.title}">
        <meta name="twitter:description" content="${event.description}">
      </head>
      <body>
        <p>Redirecting to event application details...</p>
        <script>window.location.href = "https://eventful.platform/events/${event.id}";</script>
      </body>
      </html>
    `;
    return res.status(200).send(htmlMetadata);
  }

}
