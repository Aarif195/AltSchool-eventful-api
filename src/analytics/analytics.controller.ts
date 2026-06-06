import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/generic';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@Roles(Role.CREATOR) // Protect all endpoints within this controller strictly for Creators
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get generalized portfolio performance overview metrics for a creator' })
  async getOverview(@GetUser('id') creatorId: string) {
    return this.analyticsService.getCreatorOverview(creatorId);
  }

  @Get('event/:id')
  @ApiOperation({ summary: 'Get pinpoint sales and gate attendance breakdown for a single event' })
  async getEventStats(
    @Param('id', ParseUUIDPipe) eventId: string,
    @GetUser('id') creatorId: string,
  ) {
    return this.analyticsService.getSingleEventAnalytics(eventId, creatorId);
  }
}