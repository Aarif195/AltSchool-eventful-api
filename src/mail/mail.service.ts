import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly brevoApiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private config: ConfigService) {
    this.brevoApiKey = this.config.get<string>('mail.apiKey')?.trim() || '';
    this.senderEmail = this.config.get<string>('mail.senderEmail') || '';
    this.senderName = this.config.get<string>('mail.senderName') || '';
  }

  async sendMail(to: string, subject: string, html: string, themeColor: string = '#4f46e5') {
    const finalHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${themeColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
        </div>
        <div style="padding: 30px; text-align: center; color: #333; line-height: 1.6;">
          ${html}
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} ${this.senderName}. All rights reserved.
        </div>
      </div>
    `;

    if (!this.brevoApiKey || !this.senderEmail || !this.senderName) {
      throw new InternalServerErrorException('Brevo email configuration parameters are missing');
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: finalHtml,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || response.statusText);
      }

      return data;
    } catch (error) {
      throw new InternalServerErrorException(`Brevo dispatch execution failed: ${error.message}`);
    }
  }
}