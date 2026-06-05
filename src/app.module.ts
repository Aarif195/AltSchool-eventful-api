import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { EventModule } from './event/event.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
    {
      ttl: 60000,
      limit: 100,
    },
  ]), EventModule],
  controllers: [AppController],

  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply RolesGuard globally
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Apply ValidationPipe globally
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },],
})
export class AppModule { }
