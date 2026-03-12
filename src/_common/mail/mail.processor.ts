import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailDetails } from './mail.type';
import { MailerService } from './mailer.service';

// Do not inject any dependency which depends on CONTEXT to avoid request-scoped process
@Processor('leiaqa-mail')
export class MailProcessor {
  constructor(private readonly mailerService: MailerService) {}

  @Process({ name: 'MailJob', concurrency: 2 })
  async handle(job: Job) {
    try {
      const input: MailDetails = job.data;

      if (!input || !input.to || !input.subject) {
        console.error('❌ Invalid job data:', job.data);
        return false;
      }

      await this.process(input);
      return true;
    } catch (err) {
      console.error('❌ Error processing job:', err);
      return false;
    }
  }
  // async handle(job: Job) {
  //   const input: MailDetails = job.data;
  //   return await this.process(input);
  // }

  // !Removed active event handlers to prevent duplicate processing
  // @OnQueueActive()
  // async onQueueActive(job: Job) {
  //   const input: MailDetails = job?.data;
  //   if (input && !(await job?.finished())) await this.process(input);
  // }

  // @OnGlobalQueueActive()
  // async onGlobalQueueActive(jobId: string) {
  //   const job = await this.mailQueue.getJob(jobId);
  //   const input: MailDetails = job?.data;
  //   if (input && !(await job?.finished())) await this.process(input);
  // }

  private async process(input: MailDetails) {
    let isJobDone = null;
    try {
      await this.mailerService.send(input);
      console.log('✅ Mail sent successfully to : ', input.to);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, 'Mail Job');
    } finally {
      return isJobDone;
    }
  }
}
