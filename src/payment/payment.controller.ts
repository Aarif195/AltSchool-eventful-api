import { Controller, Post, Body, Req, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Request, Response } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from './dto/payment.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { Public } from '../auth/public.decorator';

@Controller('payments')
@ApiTags('Payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  @Roles(Role.EVENTEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize Paystack payment flow for an event ticket' })
  @ApiOkResponse({ type: PaymentIntentResponseDto })
  async createIntent(
    @GetUser() user: { id: string; email: string },
    @Body() body: CreatePaymentIntentDto,
  ) {
    return this.paymentService.initializeTransaction(body.eventId, user.id, user.email);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Paystack webhook verification listener' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const signature = req.headers['x-paystack-signature'] as string;
    if (!req.rawBody) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing raw body payload');
    }

    const isValid = this.paymentService.verifyWebhookSignature(signature, req.rawBody);
    if (!isValid) {
      return res.status(HttpStatus.BAD_REQUEST).send('Invalid webhook signature integrity');
    }

    await this.paymentService.handleWebhookEvent(req.body);
    return res.status(HttpStatus.OK).send('Webhook processed successfully');
  }
}