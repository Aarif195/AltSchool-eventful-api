import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { MailModule } from 'src/mail/mail.module';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reminder-queue',
    }),
    MailModule,
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}