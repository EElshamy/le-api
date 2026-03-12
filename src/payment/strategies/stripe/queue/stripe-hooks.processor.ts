import {
  OnGlobalQueueActive,
  OnQueueActive,
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { log } from 'console';
import Stripe from 'stripe';
import { StripeQueueService } from './stripe-queue.service';

export const STRIPE_HOOKS_QUEUE = 'StripeHooksQueue',
  STRIPE_CHECKOUT_COMPLETE_JOBS = 'StripeCheckoutCompleteJobs',
  STRIPE_PAYMENT_FULFILLMENT_JOBS = 'StripePaymentFulfillmentJobs',
  STRIPE_EXPLICIT_PAYMENT_FULFILLMENT_JOBS =
    'StripeExplicitPaymentFulfillmentJobs',
  STRIPE_PAYMENT_FAILURE_JOBS = 'StripePaymentFailureJobs',
  STRIPE_REFUND_FAILURE_JOBS = 'StripeRefundFailureJobs';
@Processor(STRIPE_HOOKS_QUEUE)
export class StripeHooksProcessor {
  constructor(private readonly stripeQueueService: StripeQueueService) {}

  // @Process(STRIPE_CHECKOUT_COMPLETE_JOBS)
  // async handleCheckoutCompleteJobs(job: Job): Promise<boolean> {
  //   log('StripeHooksProcessor -> handleCheckoutCompleteJobs', job.id);
  //   const input: Stripe.Checkout.Session = job.data;
  //   let isJobDone = null;
  //   try {
  //     await this.stripeQueueService.handleCheckoutSessionCompleted.bind(
  //       this.stripeQueueService
  //     )(input);
  //     isJobDone = true;
  //   } catch (e) {
  //     console.log('Error -> ', e, STRIPE_HOOKS_QUEUE);
  //   } finally {
  //     return isJobDone;
  //   }
  // }

  @Process(STRIPE_PAYMENT_FULFILLMENT_JOBS)
  async handlePaymentFulfillmentJobs(job: Job): Promise<boolean> {
    log('StripeHooksProcessor -> handlePaymentFulfillmentJobs', job.id);
    const input: Stripe.PaymentIntent = job.data;
    let isJobDone = null;
    try {
      await this.stripeQueueService.handlePaymentFulfillment.bind(
        this.stripeQueueService
      )(input);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, STRIPE_HOOKS_QUEUE);
    } finally {
      return isJobDone;
    }
  }

  @Process(STRIPE_EXPLICIT_PAYMENT_FULFILLMENT_JOBS)
  async handleExplicitPaymentFulfillmentJobs(job: Job): Promise<boolean> {
    log('StripeHooksProcessor -> handleExplicitPaymentFulfillmentJobs', job.id);
    const input: { transactionId: string; isFreeCoupon: boolean } = job.data;
    let isJobDone = null;
    try {
      await this.stripeQueueService.handleExplicitPaymentFulfillment.bind(
        this.stripeQueueService
      )(input);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, STRIPE_HOOKS_QUEUE);
    } finally {
      return isJobDone;
    }
  }

  @Process(STRIPE_PAYMENT_FAILURE_JOBS)
  async handlePaymentFailureJobs(job: Job): Promise<boolean> {
    log('StripeHooksProcessor -> handlePaymentFailureJobs', job.id);
    const input: Stripe.PaymentIntent = job.data;
    let isJobDone = null;
    try {
      await this.stripeQueueService.handlePaymentFailure.bind(
        this.stripeQueueService
      )(input);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, STRIPE_HOOKS_QUEUE);
    } finally {
      return isJobDone;
    }
  }

  @Process(STRIPE_REFUND_FAILURE_JOBS)
  async handleRefundFailureJobs(job: Job): Promise<boolean> {
    log('StripeHooksProcessor -> handleRefundFailureJobs', job.id);
    const input: Stripe.Refund = job.data;
    let isJobDone = null;
    try {
      await this.stripeQueueService.handleRefundFailure.bind(
        this.stripeQueueService
      )(input);
      isJobDone = true;
    } catch (e) {
      console.log('Error -> ', e, STRIPE_HOOKS_QUEUE);
    } finally {
      return isJobDone;
    }
  }

  @OnQueueActive()
  async onQueueActive(job: Job): Promise<void> {
    log('StripeHooksProcessor -> onQueueActive', job.id);
  }

  @OnGlobalQueueActive()
  async onGlobalQueueActive(jobId: string): Promise<void> {
    log('StripeHooksProcessor -> onQueueActive', jobId);
  }
}
