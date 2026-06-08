import { Controller, Post, Body, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiForbiddenResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { Roles } from 'src/decorators/roles.decorator';
import { GetUser } from 'src/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Notifications')
@Controller('notifications')

@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Post('set-reminder')
    @Roles(Role.EVENTEE)
    @ApiOperation({ summary: 'Allows an attendee to configure custom alert intervals for an event' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['eventId', 'reminderDays'],
            properties: {
                eventId: {
                    type: 'string',
                    format: 'uuid',
                    example: 'a5c8df41-1191-4e7d-965b-bf4e5659828d',
                    description: 'The unique structural system UUID of the event'
                },
                reminderDays: {
                    type: 'integer',
                    example: 3,
                    description: 'Number of days prior to the event to receive a reminder notification alert'
                }
            }
        }
    })
    @ApiCreatedResponse({
        description: 'Custom attendee reminder setting preferred configuration successfully saved.',
        schema: {
            example: {
                statusCode: 201,
                id: 'preference_uuid_111',
                userId: 'user_uuid_444',
                eventId: 'a5c8df41-1191-4e7d-965b-bf4e5659828d',
                reminderDays: 3,
                isProcessed: false,
                createdAt: '2026-06-08T12:00:00.000Z'
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Validation failed due to malformed payload fields or non-UUID parameter formats.',
        schema: {
            example: {
                statusCode: 400,
                message: 'Validation failed (uuid is expected)',
                error: 'Bad Request'
            }
        }
    })
    @ApiUnauthorizedResponse({
        description: 'Missing or malformed authorization header context.',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized access token'
            }
        }
    })
    @ApiForbiddenResponse({
        description: 'Access denied due to missing role clearance (Requires EVENTEE role context).',
        schema: {
            example: {
                statusCode: 403,
                message: 'Forbidden resource: Requires EVENTEE role',
                error: 'Forbidden'
            }
        }
    })
    async setCustomReminder(
        @GetUser('id') userId: string,
        @Body('eventId', ParseUUIDPipe) eventId: string,
        @Body('reminderDays', ParseIntPipe) reminderDays: number,
    ) {
        // To access notification service to write a line directly to the DB
        return this.notificationService.saveAttendeePreference(userId, eventId, reminderDays);
    }
}
