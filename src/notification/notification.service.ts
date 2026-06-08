import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('reminder-queue') private readonly reminderQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  // Automated Engine triggered every midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUpcomingRemindersCron() {
    this.logger.log('Executing automated background scan for pending event reminders...');
    const today = new Date();

    //  PROCESS CREATOR CUSTOM RULES
    const eventsWithCreatorReminders = await this.prisma.event.findMany({
      where: {
        creatorReminderDays: { not: null },
        eventDate: { gt: today },
      },
      include: { tickets: { include: { eventee: true } } },
    });

    for (const event of eventsWithCreatorReminders) {
      const targetReminderDate = new Date(event.eventDate);
      targetReminderDate.setDate(targetReminderDate.getDate() - event.creatorReminderDays!);

      // If the target calculation day lands on today's execution timestamp range
      if (targetReminderDate.toDateString() === today.toDateString()) {
        for (const ticket of event.tickets) {
          await this.reminderQueue.add('send-email', {
            email: ticket.eventee.email,
            subject: `Upcoming Event Reminder: ${event.title}`,
            message: `<p>Hello <strong>${ticket.eventee.fullName}</strong>,</p>
                      <p>This is an automated reminder that the event <strong>${event.title}</strong> is happening soon on ${event.eventDate.toDateString()} at ${event.location}.</p>
                      <p>Have your cryptographic entry QR Code ready for validation scanning at the gate.</p>`,
          });
        }
      }
    }

    //  PROCESS EVENTEE INDIVIDUAL PREFERENCE RULES
    const activeCustomSettings = await this.prisma.notificationSetting.findMany({
      where: { isProcessed: false },
      include: { event: true, user: true },
    });

    for (const setting of activeCustomSettings) {
      const targetAttendeeDate = new Date(setting.event.eventDate);
      targetAttendeeDate.setDate(targetAttendeeDate.getDate() - setting.reminderDays);

      if (targetAttendeeDate.toDateString() === today.toDateString()) {
        await this.reminderQueue.add('send-email', {
          email: setting.user.email,
          subject: `Personalized Event Reminder: ${setting.event.title}`,
          message: `<p>Hello <strong>${setting.user.fullName}</strong>,</p>
                    <p>Per your custom reminder rule, the event <strong>${setting.event.title}</strong> is starting in ${setting.reminderDays} days (${setting.event.eventDate.toDateString()}).</p>`,
        });

        // Mark processed so we don't duplicate dispatches on subsequent runs
        await this.prisma.notificationSetting.update({
          where: { id: setting.id },
          data: { isProcessed: true },
        });
      }
    }
  }

  // saveAttendeePreference
  async saveAttendeePreference(userId: string, eventId: string, reminderDays: number) {
    return this.prisma.notificationSetting.create({
      data: {
        userId,
        eventId,
        reminderDays,
        isProcessed: false,
      },
    });
  }

}