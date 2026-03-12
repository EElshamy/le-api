import { Templates } from './templates-types';

export interface MailDetails {
  from?: string;
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  template: Templates;
  templateData: TemplatesOptions;
}

export type FromInput = {
  mail: string;
};

export interface IMailService {
  send(input: MailDetails): Promise<void>;
}

export type TemplatesOptions = {
  otp?: string;
  url?: string;
  lecturerName?: string;
  programTitle?: string;
  programType?: string;
  programSummary?: string;
  programTypeHeader?: string;
  title?: string;
  description?: string;
  diplomaName?: string;
  postTitle?: string;
  rejectionReason?: string;
  month?: string;
  updatesExplanation?: string;
  userName?: string;
  ticketNumber?: string;
  subject?: string;
  programLevel?: string;
  learningTime?: number;
  learningTimeUnit?: string;
  programImageUrl?: string;
};
