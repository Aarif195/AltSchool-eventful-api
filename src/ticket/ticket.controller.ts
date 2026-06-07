import { Controller, Post, Get, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../decorators/get-user.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiForbiddenResponse, ApiUnauthorizedResponse, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaginationQueryDto } from 'src/dto/pagination.dto';


@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  // Get all tickets bought by the logged in eventee
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Get('my-tickets')
  @Roles(Role.EVENTEE)
  @ApiOperation({ summary: 'Retrieve all bought tickets for current authenticated eventee' })
  @ApiOkResponse({
    description: 'Collection listing of user tickets compiled with on-the-fly Base64 data strings for structural rendering.',
    schema: {
      example: {
        statusCode: 200,
        data: [
          {
            id: 'ticket_uuid_001',
            eventId: 'event_uuid_123',
            purchaseDate: '2026-06-05T14:30:00.000Z',
            qrCodePayload: 'TKT-DEC-85721-SECURE-HASH-STRING',
            qrCodeBase64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
          }
        ],
        meta: {
          totalItems: 15,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 2,
          currentPage: 1
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication credentials token verification context.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized access token'
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Access denied due to missing structural authorization target role requirements (Requires EVENTEE).',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource: Requires EVENTEE role',
        error: 'Forbidden'
      }
    }
  })
  async getMyTickets(
    @GetUser('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const result = await this.ticketService.findUserTickets(userId, paginationQuery);

    // Attach base64 data URLs dynamically so frontends can display the images instantly
    const mappedData = await Promise.all(
      result.data.map(async (t) => ({
        ...t,
        qrCodeBase64Image: await this.ticketService.renderQrCodeBase64(t.qrCodePayload),
      })),
    );

    return {
      statusCode: 200,
      data: mappedData,
      meta: result.meta,
    };
  }

  //  Ticket validation at gate
  @Post('verify-gate')
  @Roles(Role.CREATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scan and cryptographically verify access ticket validity at the gate' })
  @ApiBody({ type: VerifyTicketDto })
  @ApiOkResponse({
    description: 'Ticket structural verification validation process passed. Entry authorized.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Ticket successfully verified. Access Granted.',
        ticketDetails: {
          id: 'ticket_uuid_001',
          holderName: 'John Doe',
          eventName: 'Tech Innovators Summit 2026'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'The scanned cryptographic payload structure has failed checksum integrity checks or has already been used.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Ticket has already been scanned and used for entry.',
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Missing signature verification parameters context.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized access token'
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Only creator context accounts holding authorization access keys can check-in entry tokens (Requires CREATOR).',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource: Requires CREATOR role',
        error: 'Forbidden'
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'The scanned ticket reference could not be located or identified inside the ecosystem dataset infrastructure.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Invalid ticket reference token entity mapping payload data target matching rules.',
        error: 'Not Found'
      }
    }
  })
  async verifyGate(@Body() dto: VerifyTicketDto, @GetUser('id') creatorId: string) {
    return this.ticketService.verifyTicketGate(dto.qrCodePayload, creatorId);
  }
}