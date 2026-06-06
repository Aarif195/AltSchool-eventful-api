import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiOkResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@Roles(Role.CREATOR)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('overview')
  @ApiOperation({ summary: 'Get generalized portfolio performance overview metrics for a creator' })
  @ApiOkResponse({
    description: 'Portfolio structural metrics compiled successfully.',
    schema: {
      example: {
        statusCode: 200,
        data: {
          totalEventsCreated: 12,
          totalTicketsSold: 1450,
          totalRevenueGenerated: 2175000.00,
          overallCheckInRatePercentage: 92.0
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or malformed context authentication token payload signature.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized access token'
      }
    }
  })
  async getOverview(@GetUser('id') creatorId: string) {
    return this.analyticsService.getCreatorOverview(creatorId);
  }

  @Get('event/:id')
  @ApiOperation({ summary: 'Get pinpoint sales and gate attendance breakdown for a single event' })
  @ApiParam({
    name: 'id',
    description: 'The unique system structural UUID of the targeted event entry resource',
    type: String,
    example: 'a5c8df41-1191-4e7d-965b-bf4e5659828d'
  })
  @ApiOkResponse({
    description: 'Pinpoint sales and target verification parameters metrics compiled successfully.',
    schema: {
      example: {
        statusCode: 200,
        data: {
          title: 'Tech Innovators Summit 2026',
          eventId: 'a5c8df41-1191-4e7d-965b-bf4e5659828d',
          eventDate: '2026-12-20T18:00:00Z',
          ticketsSold: 450,
          revenue: 675000.00,
          checkInRatePercentage: 90.0
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or expired user session access token validation.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized access token'
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'The requested event ID could not be matched inside the creator portfolio dataset structure.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Event analytics resource dataset entity matching criteria not found.',
        error: 'Not Found'
      }
    }
  })
  async getEventStats(
    @Param('id', ParseUUIDPipe) eventId: string,
    @GetUser('id') creatorId: string,
  ) {
    return this.analyticsService.getSingleEventAnalytics(eventId, creatorId);
  }
}