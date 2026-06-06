import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiInternalServerErrorResponse, ApiOkResponse } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Get()
  @ApiOperation({ summary: 'Welcome root endpoint' })
  @ApiOkResponse({
    description: 'Welcome message retrieved successfully.',
    schema: {
      type: 'string',
      example: 'Welcome to the Eventful REST API'
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error'
      }
    }
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
