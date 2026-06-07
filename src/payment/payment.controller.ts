import { Controller, Post, Body, Req, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Request, Response } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from './dto/payment.dto';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../decorators/get-user.decorator';
import { Public } from '../decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';


@Controller('payments')
@ApiTags('Payment')

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('initialize')
  @Roles(Role.EVENTEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize Paystack payment flow for an event ticket' })
  @ApiOkResponse({ type: PaymentIntentResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or the requested event is fully booked/unavailable.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Event capacity exceeded or event ID is invalid',
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or expired user session access token.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized access token'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the requested event is fully booked/unavailable.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Event capacity exceeded or event ID is invalid',
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or expired user session access token.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized access token'
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Only users holding the EVENTEE role permission scope can access this endpoint.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource: Requires EVENTEE role',
        error: 'Forbidden'
      }
    }
  })

  async createIntent(
    @GetUser() user: { id: string; email: string },
    @Body() body: CreatePaymentIntentDto,
  ) {
    return this.paymentService.initializeTransaction(body.eventId, user.id, user.email);
  }


  // webhook
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Paystack webhook verification listener' })
  @ApiHeader({
    name: 'x-paystack-signature',
    description: 'HMAC SHA512 signature string used to verify data payload authenticity from Paystack servers',
    required: true,
    schema: { type: 'string' }
  })
  @ApiOkResponse({
    description: 'Webhook verification passed and downstream data events successfully updated.',
    schema: {
      type: 'string',
      example: 'Webhook processed successfully'
    }
  })
  @ApiBadRequestResponse({
    description: 'Payload data integrity verification checks failed or raw content payload was missing.',
    schema: {
      type: 'string',
      example: 'Invalid webhook signature integrity'
    }
  })
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