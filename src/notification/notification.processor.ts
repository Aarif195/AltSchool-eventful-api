import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { Logger } from '@nestjs/common';

@Processor('reminder-queue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'send-email') {
      const { email, subject, message } = job.data;
      this.logger.log(`Processing asynchronous email queue job #${job.id} targeting ${email}`);

      // Leverage Brevo engine directly
      await this.mailService.sendMail(email, subject, message);
      this.logger.log(`Successfully dispatched background alert to ${email}`);
    }
  }
}