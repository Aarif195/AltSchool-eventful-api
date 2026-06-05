import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { HttpModule } from '@nestjs/axios';
import { TicketService } from 'src/ticket/ticket.service';

@Module({
  imports: [HttpModule],
  providers: [PaymentService, TicketService],
  controllers: [PaymentController]
})
export class PaymentModule {}
