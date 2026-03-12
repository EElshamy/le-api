import {
  OnGlobalQueueActive,
  OnQueueActive,
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { log } from 'console';
// import Stripe from 'stripe';
import { GeideaQueueService } from './geidea-queue.service';

export const GEIDEA_HOOKS_QUEUE = 'GeideaHooksQueue',
  GEIDEA_CHECKOUT_COMPLETE_JOBS = 'GeideaCheckoutCompleteJobs',
  GEIDEA_PAYMENT_FULFILLMENT_JOBS = 'GeideaPaymentFulfillmentJobs',
  GEIDEA_EXPLICIT_PAYMENT_FULFILLMENT_JOBS =
    'GeideaExplicitPaymentFulfillmentJobs',
  GEIDEA_PAYMENT_FAILURE_JOBS = 'GeideaPaymentFailureJobs',
  GEIDEA_REFUND_FAILURE_JOBS = 'GeideaRefundFailureJobs';
@Processor(GEIDEA_HOOKS_QUEUE)
export class GeideaHooksProcessor {
  constructor(private readonly geideaQueueService: GeideaQueueService) {}

  // @Process(GEIDEA_CHECKOUT_COMPLETE_JOBS)
  // async handleCheckoutCompleteJobs(job: Job): Promise<boolean> {
  //   log('GeideaHooksProcessor -> handleCheckoutCompleteJobs', job.id);
  //   const input: Stripe.Checkout.Session = job.data;
  //   let isJobDone = null;
  //   try {
  //     await this.geideaQueueService.handleCheckoutSessionCompleted.bind(
  //       this.geideaQueueService
  //     )(input);
  //     isJobDone = true;
  //   } catch (e) {
  //     console.log('Error -> ', e, GEIDEA_HOOKS_QUEUE);
  //   } finally {
  //     return isJobDone;
  //   }
  // }

  @Process(GEIDEA_PAYMENT_FULFILLMENT_JOBS)
  async handlePaymentFulfillmentJobs(job: Job): Promise<boolean> {
    log('GeideaHooksProcessor -> handlePaymentFulfillmentJobs', job.id);
    const input: any = job.data;
    let isJobDone = null;
    try {
      await this.geideaQueueService.handlePaymentFulfillment.bind(
        this.geideaQueueService
      )(input);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, GEIDEA_HOOKS_QUEUE);
    } finally {
      return isJobDone;
    }
  }

  @Process(GEIDEA_EXPLICIT_PAYMENT_FULFILLMENT_JOBS)
  async handleExplicitPaymentFulfillmentJobs(job: Job): Promise<boolean> {
    log('GeideaHooksProcessor -> handleExplicitPaymentFulfillmentJobs', job.id);
    const input: { transactionId: string; isFreeCoupon: boolean } = job.data;
    let isJobDone = null;
    try {
      await this.geideaQueueService.handleExplicitPaymentFulfillment.bind(
        this.geideaQueueService
      )(input);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, GEIDEA_HOOKS_QUEUE);
    } finally {
      return isJobDone;
    }
  }

  //! this will not be used, due to current business requirements
  @Process(GEIDEA_PAYMENT_FAILURE_JOBS)
  async handlePaymentFailureJobs(job: Job): Promise<boolean> {
    log('GeideaHooksProcessor -> handlePaymentFailureJobs', job.id);
    const input: any = job.data;
    let isJobDone = null;
    try {
      await this.geideaQueueService.handlePaymentFailure.bind(
        this.geideaQueueService
      )(input);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, GEIDEA_HOOKS_QUEUE);
    } finally {
      return isJobDone;
    }
  }

  //! this will not be used, due to current business requirements
  // @Process(GEIDEA_REFUND_FAILURE_JOBS)
  // async handleRefundFailureJobs(job: Job): Promise<boolean> {
  //   log('GeideaHooksProcessor -> handleRefundFailureJobs', job.id);
  //   const input: any = job.data;
  //   let isJobDone = null;
  //   try {
  //     await this.geideaQueueService.handleRefundFailure.bind(
  //       this.geideaQueueService
  //     )(input);
  //     isJobDone = true;
  //   } catch (e) {
  //     console.log('Error -> ', e, GEIDEA_HOOKS_QUEUE);
  //   } finally {
  //     return isJobDone;
  //   }
  // }

  @OnQueueActive()
  async onQueueActive(job: Job): Promise<void> {
    log('GeideaHooksProcessor -> onQueueActive', job.id);
  }

  @OnGlobalQueueActive()
  async onGlobalQueueActive(jobId: string): Promise<void> {
    log('GeideaHooksProcessor -> onQueueActive', jobId);
  }
}
