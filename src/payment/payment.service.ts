import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { TicketService } from 'src/ticket/ticket.service';

@Injectable()
export class PaymentService {
    private readonly baseUrl = 'https://api.paystack.co';
    private readonly secretKey: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
        private readonly ticketService: TicketService,
    ) {
        this.secretKey = this.configService.getOrThrow<string>('paystack.secretKey');
    }

    async initializeTransaction(eventId: string, userId: string, email: string) {
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
            throw new NotFoundException('Selected event does not exist');
        }
        if (event.availableTickets <= 0) {
            throw new BadRequestException('This event is completely sold out');
        }

        const priceInKobo = Math.round(Number(event.ticketPrice) * 100);

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/transaction/initialize`,
                    {
                        amount: priceInKobo,
                        email,
                        metadata: { eventId, userId },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.secretKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            const { reference, authorization_url } = response.data.data;

            await this.prisma.transaction.create({
                data: {
                    reference,
                    amount: event.ticketPrice,
                    status: TransactionStatus.PENDING,
                    userId,
                    eventId,
                },
            });

            return response.data.data;
        } catch (error) {
            throw new BadRequestException(`Paystack Init Error: ${error.response?.data?.message || error.message}`);
        }
    }

    verifyWebhookSignature(signature: string, rawBody: Buffer): boolean {
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(rawBody)
            .digest('hex');
        return hash === signature;
    }

    async handleWebhookEvent(event: any) {
        if (event.event === 'charge.success') {
            const { reference, metadata } = event.data;

            await this.prisma.$transaction(async (tx) => {
                const transaction = await tx.transaction.findUnique({
                    where: { reference },
                });

                if (!transaction || transaction.status === TransactionStatus.SUCCESSFUL) {
                    return;
                }

                await tx.transaction.update({
                    where: { reference },
                    data: { status: TransactionStatus.SUCCESSFUL },
                });

                await tx.event.update({
                    where: { id: metadata.eventId },
                    data: { availableTickets: { decrement: 1 } },
                });

                // Next Phase Hook: Ticket generation will trigger right here!

                await tx.event.update({
                    where: { id: metadata.eventId },
                    data: { availableTickets: { decrement: 1 } },
                });

                // Trigger generation immediately upon database update confirmation
                await this.ticketService.generateTicket(metadata.eventId, metadata.userId);


            });
        }
    }
}