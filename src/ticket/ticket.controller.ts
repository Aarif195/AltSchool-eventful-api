import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('my-tickets')
  @Roles(Role.EVENTEE)
  @ApiOperation({ summary: 'Retrieve all bought tickets for current authenticated eventee' })
  async getMyTickets(@GetUser('id') userId: string) {
    const tickets = await this.ticketService.findUserTickets(userId);
    
    // Attach base64 data URLs dynamically so frontends can display the images instantly
    return Promise.all(
      tickets.map(async (t) => ({
        ...t,
        qrCodeBase64Image: await this.ticketService.renderQrCodeBase64(t.qrCodePayload),
      })),
    );
  }

  @Post('verify-gate')
  @Roles(Role.CREATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scan and cryptographically verify access ticket validity at the gate' })
  async verifyGate(@Body() dto: VerifyTicketDto, @GetUser('id') creatorId: string) {
    return this.ticketService.verifyTicketGate(dto.qrCodePayload, creatorId);
  }
}