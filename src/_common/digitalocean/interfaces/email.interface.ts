import { Injectable } from '@nestjs/common';

export interface IEmailStrategy {
  sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    attachments?: {
      filename: string;
      content: string;
      contentType: string;
    }[],
  ): Promise<void>;
}
