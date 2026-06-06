import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { PaginationQueryDto } from 'src/dto/pagination.dto';

@Injectable()
export class TicketService {
  private readonly secretKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.secretKey = process.env.JWT_SECRET || 'fallbackSuperSecretKeyChangeThisInProd';
  }

  // Generates and saves a ticket with a cryptographically signed payload
  async generateTicket(eventId: string, eventeeId: string) {
    const ticketId = crypto.randomUUID();

    // Create a secure payload hash: HMAC(ticketId + eventId + eventeeId)
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${ticketId}:${eventId}:${eventeeId}`)
      .digest('hex');

    const qrCodePayload = `${ticketId}.${signature}`;

    return this.prisma.ticket.create({
      data: {
        id: ticketId,
        eventId,
        eventeeId,
        qrCodePayload,
        status: TicketStatus.VALID,
      },
      include: { event: true },
    });
  }

  // Converts raw text payload to a base64 data URL for frontend rendering
  async renderQrCodeBase64(payload: string): Promise<string> {
    try {
      return await QRCode.toDataURL(payload);
    } catch (err) {
      throw new BadRequestException('Failed to compile ticket QR code image');
    }
  }

  // Find all tickets belonging to an Eventee
  async findUserTickets(userId: string, paginationQuery: PaginationQueryDto) {

    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.ticket.count({ where: { eventeeId: userId } }),
      this.prisma.ticket.findMany({
        where: { eventeeId: userId },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);


    return {
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

  // Creator Gate-Verification Engine
  async verifyTicketGate(qrCodePayload: string, creatorId: string) {
    const parts = qrCodePayload.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Malformed or invalid QR code format');
    }

    const [ticketId, providedSignature] = parts;

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket record not found in the platform database');
    }

    // Verify ownership: Only the creator of this specific event can scan/verify the ticket
    if (ticket.event.creatorId !== creatorId) {
      throw new ForbiddenException('Access denied. You are not the creator of this event.');
    }

    // Cryptographic validation checks
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${ticket.id}:${ticket.eventId}:${ticket.eventeeId}`)
      .digest('hex');

    if (expectedSignature !== providedSignature) {
      throw new BadRequestException('Ticket token signature verification failed. Counterfeit ticket detected.');
    }

    if (ticket.status === TicketStatus.SCANNED) {
      throw new BadRequestException(`Ticket has already been scanned at ${ticket.scannedAt}`);
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('This ticket has been cancelled and is no longer valid');
    }

    // Update state to scanned
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.SCANNED,
        scannedAt: new Date(),
      },
    });
  }
}