import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssignUserToLearningProgramEvent } from '@src/course/interfaces/assign-user.interface';
import { TRANSACTION_FULFILLED_EVENT } from '@src/payment/constants/events-tokens.constants';
import {
  TransactionStateChangeEnum,
  TransactionStatusEnum
} from '@src/payment/enums/transaction-status.enum';
import { TransactionCardBrandEnum } from '@src/payment/enums/transaction-targets.enum';
import { Transaction } from '@src/payment/models/transaction.model';
import { CouponService } from '@src/payment/services/coupon.service';
import { TransactionLogService } from '@src/payment/services/transaction-logs.service';
import { TransactionService } from '@src/payment/services/transaction.service';
import { WalletService } from '@src/payment/services/wallet.service';
import { log } from 'node:console';
import { Transactional } from 'sequelize-transactional-typescript';
import Stripe from 'stripe';

@Injectable()
export class StripeQueueService {
  private readonly stripe: Stripe;
  private readonly stripeConfigs: Record<string, string> = {};
  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly transactionLogService: TransactionLogService,
    private readonly transactionService: TransactionService,
    private readonly couponService: CouponService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.stripeConfigs['success_url'] = this.configService.get<string>(
      'PAYMENT_SUCCESS_URL'
    );
    this.stripeConfigs['currency'] =
      this.configService.get<string>('PAYMENT_CURRENCY') ?? 'usd';

    this.stripeConfigs['secretKey'] =
      this.configService.get<string>('STRIPE_SECRET_KEY');

    this.stripeConfigs['webhookSecret'] = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    );

    this.stripe = new Stripe(this.stripeConfigs['secretKey'], {
      apiVersion: null as unknown as Stripe.LatestApiVersion
    });
  }

  // @Transactional()
  // async handlePaymentFulfillment(
  //   checkoutSession: Stripe.Checkout.Session
  // ): Promise<void> {
  //   const transaction =
  //     await this.transactionService.getTransactionByRemoteCheckoutSessionId(
  //       checkoutSession.id
  //     );
  //   if (checkoutSession?.payment_intent) {
  //     const paymentIntent = await this.stripe.paymentIntents.retrieve(
  //       typeof checkoutSession.payment_intent === 'object' ?
  //         checkoutSession.payment_intent.id
  //       : checkoutSession.payment_intent
  //     );
  //     const sessionPaymentMethod = await this.stripe.paymentMethods.retrieve(
  //       typeof paymentIntent.payment_method === 'object' ?
  //         paymentIntent.payment_method.id
  //       : paymentIntent.payment_method
  //     );

  //     //1.1 update transaction with the remoteTransactionId from stripe
  //     transaction.remoteTransactionId = paymentIntent.id;

  //     //1.2 update transaction status and payment details
  //     transaction.status = TransactionStatusEnum.SUCCESS;

  //     if (!transaction.paymentDetails)
  //       transaction.paymentDetails = {
  //         billingDetails: {
  //           address: {
  //             city: sessionPaymentMethod.billing_details.address.city,
  //             country: sessionPaymentMethod.billing_details.address.country,
  //             state: sessionPaymentMethod.billing_details.address.state,
  //             zip: sessionPaymentMethod.billing_details.address.postal_code
  //           },
  //           email: sessionPaymentMethod.billing_details.email,
  //           name: sessionPaymentMethod.billing_details.name,
  //           phone: sessionPaymentMethod.billing_details.phone
  //         },
  //         last4: sessionPaymentMethod.card.last4,
  //         cardBrand: this.getCardBrandEnum(sessionPaymentMethod.card.brand)
  //       };

  //     await transaction.save();
  //   } else {
  //     transaction.status = TransactionStatusEnum.SUCCESS;
  //     await transaction.save();
  //   }

  //   await this.transactionLogService.createTransactionLog({
  //     transaction,
  //     changedBy: transaction.user,
  //     status: TransactionStatusEnum.SUCCESS,
  //     change: TransactionStateChangeEnum.TRANSACTION_FULFILLED
  //   });

  //   //2. handle the wallets state mutations
  //   await this.walletService.handleWalletsStateMutations(transaction);

  //   //3. if its has a coupon, update the coupon usage
  //   if (checkoutSession.metadata?.couponId) {
  //     console.log('debugging_______before updateCouponUsageCount______');
  //     await this.couponService.updateCouponUsageCount(
  //       checkoutSession.metadata.couponId
  //     );
  //   }
  //   console.log('debugging_______before emit______');
  //   //4. emit the transaction fulfilled event
  //   let resetCart = false;
  //   console.log(
  //     'checkoutSession.metadata',
  //     checkoutSession.metadata?.resetCart
  //   );

  //   if (checkoutSession.metadata?.resetCart === 'true') {
  //     resetCart = true;
  //   }

  //   console.log('debugging_______before emit______', resetCart);

  //   this.eventEmitter.emitAsync(
  //     TRANSACTION_FULFILLED_EVENT,
  //     this.getTransactionFulfilledEventPayload(transaction, resetCart)
  //   );
  // }

  @Transactional()
  async handlePaymentFulfillment(
    eventObject: Stripe.Checkout.Session | Stripe.PaymentIntent
  ): Promise<void> {
    let transaction: Transaction;
    let paymentIntent: Stripe.PaymentIntent | null = null;
    let paymentMethod: Stripe.PaymentMethod;
    let metadata: any = {};
  
    if ('object' in eventObject && eventObject.object === 'checkout.session') {
      const checkoutSession = eventObject as Stripe.Checkout.Session;
      metadata = checkoutSession.metadata || {};
  
      transaction =
        await this.transactionService.getTransactionByRemoteCheckoutSessionId(
          checkoutSession.id
        );
  
      if (checkoutSession?.payment_intent) {
        paymentIntent = await this.stripe.paymentIntents.retrieve(
          typeof checkoutSession.payment_intent === 'object'
            ? checkoutSession.payment_intent.id
            : checkoutSession.payment_intent
        );
      } else {
        console.log('No payment intent attached. Possibly a free transaction.');
      }
  
    } else if (
      'object' in eventObject &&
      eventObject.object === 'payment_intent'
    ) {
      paymentIntent = eventObject as Stripe.PaymentIntent;
      metadata = paymentIntent.metadata || {};
  
      transaction =
        await this.transactionService.getTransactionByRemotePaymentIntentId(
          paymentIntent.id
        );
    } else {
      console.log('Unsupported event object type');
    }
  
    transaction.remoteTransactionId = paymentIntent?.id ;
    transaction.status = TransactionStatusEnum.SUCCESS;
  
    if (paymentIntent?.payment_method) {
      paymentMethod = await this.stripe.paymentMethods.retrieve(
        typeof paymentIntent.payment_method === 'object'
          ? paymentIntent.payment_method.id
          : paymentIntent.payment_method
      );
  
      if (!transaction.paymentDetails && paymentMethod && paymentMethod.card) {
        transaction.paymentDetails = {
          billingDetails: {
            address: {
              city: paymentMethod.billing_details.address?.city,
              country: paymentMethod.billing_details.address?.country,
              state: paymentMethod.billing_details.address?.state,
              zip: paymentMethod.billing_details.address?.postal_code
            },
            email: paymentMethod.billing_details.email,
            name: paymentMethod.billing_details.name,
            phone: paymentMethod.billing_details.phone
          },
          last4: paymentMethod.card.last4,
          cardBrand: this.getCardBrandEnum(paymentMethod.card.brand)
        };
      }
    }
  
    await transaction.save();
  
    await this.transactionLogService.createTransactionLog({
      transaction,
      changedBy: transaction.user,
      status: TransactionStatusEnum.SUCCESS,
      change: TransactionStateChangeEnum.TRANSACTION_FULFILLED
    });
  
    await this.walletService.handleWalletsStateMutations(transaction);
  
    if (metadata.couponId) {
      await this.couponService.updateCouponUsageCount(metadata.couponId);
    }
  
    const resetCart = metadata.resetCart === 'true';
    this.eventEmitter.emitAsync(
      TRANSACTION_FULFILLED_EVENT,
      this.getTransactionFulfilledEventPayload(transaction, resetCart)
    );
  }

  getCardBrandEnum(cardBrand: string): TransactionCardBrandEnum {
    switch (cardBrand) {
      case 'visa':
        return TransactionCardBrandEnum.VISA;
      case 'mastercard':
        return TransactionCardBrandEnum.MASTERCARD;
      case 'amex':
        return TransactionCardBrandEnum.AMEX;
      case 'diners':
        return TransactionCardBrandEnum.DINERS;
      case 'discover':
        return TransactionCardBrandEnum.DISCOVER;
      case 'eftpos_au':
        return TransactionCardBrandEnum.EFTPOS_AU;
      case 'jcb':
        return TransactionCardBrandEnum.JCB;
      case 'link':
        return TransactionCardBrandEnum.LINK;
      case 'unionpay':
        return TransactionCardBrandEnum.UNIONPAY;
      default:
        return TransactionCardBrandEnum.UNKNOWN;
    }
  }
  @Transactional()
  async handleExplicitPaymentFulfillment(input: {
    transactionId: string;
    isFreePayment: boolean;
  }): Promise<void> {
    const { transactionId, isFreePayment } = input;
    log(
      'inside handleExplicitPaymentFulfillment',
      transactionId,
      isFreePayment
    );
    const transaction =
      await this.transactionService.getTransactionById(transactionId);

    if (isFreePayment) {
      transaction.paymentDetails = {
        cardBrand: TransactionCardBrandEnum.FREE_COUPON,
        billingDetails: null,
        last4: null
      };
    } else {
      transaction.paymentDetails = {
        cardBrand: TransactionCardBrandEnum.FREE,
        billingDetails: null,
        last4: null
      };
    }

    //1.2 update transaction status and payment details
    transaction.status = TransactionStatusEnum.SUCCESS;

    await transaction.save();

    await this.transactionLogService.createTransactionLog({
      transaction,
      changedBy: transaction.user,
      status: TransactionStatusEnum.SUCCESS,
      change: TransactionStateChangeEnum.TRANSACTION_FULFILLED
    });

    //2. handle the wallets state mutations
    await this.walletService.handleWalletsStateMutations(transaction);

    console.log('debugging_______before emit______');

    //4. emit the transaction fulfilled event
    this.eventEmitter.emitAsync(
      TRANSACTION_FULFILLED_EVENT,
      this.getTransactionFulfilledEventPayload(transaction)
    );
  }

  //! this will not be used, due to current business requirements
  @Transactional()
  async handlePaymentFailure(
    checkoutSession: Stripe.Checkout.Session
  ): Promise<void> {
    const transaction =
      await this.transactionService.getTransactionByRemoteCheckoutSessionId(
        checkoutSession.id
      );

    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      typeof checkoutSession.payment_intent === 'object' ?
        checkoutSession.payment_intent.id
      : checkoutSession.payment_intent
    );
    if (checkoutSession.status !== 'expired') {
      transaction.status =
        paymentIntent.status === 'canceled' ?
          TransactionStatusEnum.CANCELED
        : TransactionStatusEnum.FAILED;
      transaction.failureReason = paymentIntent.last_payment_error.message;
      await transaction.save();

      await this.transactionLogService.createTransactionLog({
        transaction,
        changedBy: transaction.user,
        status:
          paymentIntent.status === 'canceled' ?
            TransactionStatusEnum.CANCELED
          : TransactionStatusEnum.FAILED,
        change: TransactionStateChangeEnum.TRANSACTION_FAILED
      });
    } else {
      transaction.status = TransactionStatusEnum.EXPIRED;
      transaction.failureReason = paymentIntent.last_payment_error.message;
      await transaction.save();

      await this.transactionLogService.createTransactionLog({
        transaction,
        changedBy: transaction.user,
        status: TransactionStatusEnum.EXPIRED,
        change: TransactionStateChangeEnum.TRANSACTION_EXPIRED
      });
    }
    //TODO: handle the wallet state mutations
    //!there is no need to handle the wallet state mutations as we are only
    //!perform calculations after payment success not failure nor cancellation
    //!and a payment is impossible to transition from success to failure or cancellation
  }

  //! this will not be used, due to current business requirements
  @Transactional()
  async handleRefundFailure(refund: Stripe.Refund): Promise<void> {
    const transaction =
      await this.transactionService.getTransactionByRemotePaymentIntentId(
        typeof refund.payment_intent === 'object' ?
          refund.payment_intent.id
        : refund.payment_intent
      );

    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      typeof refund.payment_intent === 'object' ?
        refund.payment_intent.id
      : refund.payment_intent
    );

    //TODO: handle this case with special enum value REFUND_FAILURE
    transaction.status = TransactionStatusEnum.FAILED;
    transaction.failureReason = paymentIntent.last_payment_error.message;
    await transaction.save();

    await this.transactionLogService.createTransactionLog({
      transaction,
      changedBy: transaction.user,
      status: TransactionStatusEnum.FAILED,
      change: TransactionStateChangeEnum.TRANSACTION_FAILED
    });

    //TODO: handle the wallet state mutations
    //!there is no need to handle the wallet state mutations as we are only
    //!perform calculations after payment success not failure nor cancellation
    //!and a payment is impossible to transition from success to failure or cancellation
  }

  getTransactionFulfilledEventPayload(
    transaction: Transaction,
    resetCart = false
  ): AssignUserToLearningProgramEvent {
    const event = new AssignUserToLearningProgramEvent();
    event.userId = transaction.user.id;
    event.learningPrograms = [];
    for (const item of transaction.purchase.purchaseItems) {
      event.learningPrograms.push({
        learningProgramId: item.learningProgramId,
        learningProgramType: item.type
      });
    }
    event.resetCart = resetCart;
    return event;
  }
}
