import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    schema: {
      example: {
        statusCode: 201,
        message: 'Registration successful',
        data: { id: 'user_uuid', email: 'user@example.com', fullName: 'John Doe', role: 'CREATOR orEVENTEE' }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Validation failed / Invalid request body.',
    schema: {
      example: {
        statusCode: 400,
        message: ['Password must be at least 6 characters long'],
        error: 'Bad Request'
      }
    }
  })
  @ApiConflictResponse({
    description: 'Email already exists.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email address already registered',
        error: 'Conflict'
      }
    }
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an existing user' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User logged in successfully. Returns JWT token.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login successful',
        backendAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials provided.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid email or password',
        error: 'Bad Request'
      }
    }
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}