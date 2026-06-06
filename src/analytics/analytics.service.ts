import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, TicketStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // High-level overview metrics across ALL events owned by a single creator
  async getCreatorOverview(creatorId: string) {
    const events = await this.prisma.event.findMany({
      where: { creatorId },
      select: { id: true },
    });

    const eventIds = events.map((e) => e.id);

    if (eventIds.length === 0) {
      return {
        totalEventsCreated: 0,
        totalTicketsSold: 0,
        grossRevenue: 0,
        overallCheckInRatePercentage: 0,
      };
    }

    //  Calculate Gross Revenue and Total Tickets Sold
    const transactionStats = await this.prisma.transaction.aggregate({
      where: {
        eventId: { in: eventIds },
        status: TransactionStatus.SUCCESSFUL,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    //  Calculate Check-In Ratios (Valid vs Scanned at Gate)
    const ticketStats = await this.prisma.ticket.groupBy({
      by: ['status'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    });

    let scannedCount = 0;
    let totalTickets = 0;

    ticketStats.forEach((stat) => {
      totalTickets += stat._count.id;
      if (stat.status === TicketStatus.SCANNED) {
        scannedCount += stat._count.id;
      }
    });

    const grossRevenue = transactionStats._sum.amount ? Number(transactionStats._sum.amount) : 0;
    const checkInRate = totalTickets > 0 ? Math.round((scannedCount / totalTickets) * 100) : 0;

    return {
      totalEventsCreated: eventIds.length,
      totalTicketsSold: transactionStats._count.id,
      grossRevenue,
      overallCheckInRatePercentage: checkInRate,
    };
  }

  // Granular analytics breakdown for one specific event
  async getSingleEventAnalytics(eventId: string, creatorId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('The requested event does not exist');
    }

    if (event.creatorId !== creatorId) {
      throw new ForbiddenException('Access denied. You are not the owner of this event.');
    }

    const successfulTransactions = await this.prisma.transaction.aggregate({
      where: { eventId, status: TransactionStatus.SUCCESSFUL },
      _sum: { amount: true },
      _count: { id: true },
    });

    const ticketStats = await this.prisma.ticket.groupBy({
      by: ['status'],
      where: { eventId },
      _count: { id: true },
    });

    let scannedCount = 0;
    let totalTickets = 0;

    ticketStats.forEach((stat) => {
      totalTickets += stat._count.id;
      if (stat.status === TicketStatus.SCANNED) {
        scannedCount += stat._count.id;
      }
    });

    const grossRevenue = successfulTransactions._sum.amount ? Number(successfulTransactions._sum.amount) : 0;
    const checkInRate = totalTickets > 0 ? Math.round((scannedCount / totalTickets) * 100) : 0;

    return {
      title: event.title,
      eventDate: event.eventDate,
      totalCapacity: event.totalCapacity,
      availableTickets: event.availableTickets,
      ticketsSold: successfulTransactions._count.id,
      grossRevenue,
      checkInRatePercentage: checkInRate,
    };
  }
}