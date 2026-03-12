import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
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
export class GeideaQueueService {
  // private readonly stripe: Stripe;
  private readonly geideaConfigs: Record<string, string> = {};
  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly transactionLogService: TransactionLogService,
    private readonly transactionService: TransactionService,
    private readonly couponService: CouponService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // this.stripeConfigs['success_url'] = this.configService.get<string>(
    //   'PAYMENT_SUCCESS_URL'
    // );
    // this.stripeConfigs['currency'] =
    //   this.configService.get<string>('PAYMENT_CURRENCY') ?? 'usd';

    // this.stripeConfigs['secretKey'] =
    //   this.configService.get<string>('STRIPE_SECRET_KEY');

    // this.stripeConfigs['webhookSecret'] = this.configService.get<string>(
    //   'STRIPE_WEBHOOK_SECRET'
    // );

    // this.stripe = new Stripe(this.stripeConfigs['secretKey'], {
    //   apiVersion: null as unknown as Stripe.LatestApiVersion
    // });

    this.geideaConfigs['merchant_id'] =
      this.configService.get<string>('GEIDEA_MERCHANT_ID');
    this.geideaConfigs['api_password'] = this.configService.get<string>(
      'GEIDEA_API_PASSWORD'
    );
    this.geideaConfigs['api_url'] =
      this.configService.get<string>('GEIDEA_API_URL');

    this.geideaConfigs['webhook-url'] = this.configService.get<string>(
      'GEIDEA_CALLBACK_URL'
    );

    this.geideaConfigs['success_url'] =
      this.configService.get<string>('GEIDEA_SUCCESS_URL');
    this.geideaConfigs['failure_url'] =
      this.configService.get<string>('GEIDEA_FAILURE_URL');

    this.geideaConfigs['geidea_currency'] =
      this.configService.get<string>('GEIDEA_CURRENCY');
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

  // @Transactional()
  // async handlePaymentFulfillment(geideaWebhookPayload: any): Promise<void> {
  //   const order = geideaWebhookPayload.order;

  //   console.log('order', order);
  //   console.log('----------------------------');

  //   const transaction =
  //     await this.transactionService.getTransactionByRemoteCheckoutSessionId(
  //       order.paymentIntent.id
  //     );

  //   transaction.remoteTransactionId = order.orderId;
  //   // transaction.merchantReferenceId = order.merchantReferenceId;
  //   transaction.status = TransactionStatusEnum.SUCCESS;

  //   transaction.paymentDetails = {
  //     billingDetails: {
  //       name: order.customerName,
  //       email: order.customerEmail,
  //       phone: order.customerPhoneNumber,
  //       address: {
  //         city: order.billingAddress?.city ?? null,
  //         country: order.billingAddress?.countryCode ?? null,
  //         state: null,
  //         zip: order.billingAddress?.postCode ?? null
  //       }
  //     },
  //     last4: order.paymentMethod?.maskedCardNumber?.slice(-4) ?? null,
  //     cardBrand: this.getCardBrandEnum(order.paymentMethod?.brand)
  //   };

  //   await transaction.save();

  //   await this.transactionLogService.createTransactionLog({
  //     transaction,
  //     changedBy: transaction.user,
  //     status: TransactionStatusEnum.SUCCESS,
  //     change: TransactionStateChangeEnum.TRANSACTION_FULFILLED
  //   });

  //   await this.walletService.handleWalletsStateMutations(transaction);

  //   let metadata: GeideaCustomMetadata = transaction.tempMetaData || {};

  //   if (metadata?.couponId) {
  //     await this.couponService.updateCouponUsageCount(metadata.couponId);
  //   }

  //   const resetCart = metadata?.resetCart || false;
  //   this.eventEmitter.emitAsync(
  //     TRANSACTION_FULFILLED_EVENT,
  //     this.getTransactionFulfilledEventPayload(transaction, resetCart)
  //   );
  // }

  @Transactional()
  async handlePaymentFulfillment(geideaWebhookPayload: any): Promise<void> {
    const order = geideaWebhookPayload.order;
    // console.log('order', order);
    // console.log('----------------------------');

    const remoteId = order.merchantReferenceId;

    // console.log('remoteId', remoteId);
    // console.log('-------------------------');

    if (!remoteId) {
      throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR);
    }

    const transaction =
      await this.transactionService.getTransactionByRemoteCheckoutSessionId(
        remoteId
      );

    transaction.remoteTransactionId = order.orderId;
    // transaction.merchantReferenceId = order.merchantReferenceId;
    transaction.status = TransactionStatusEnum.SUCCESS;

    let paymentData = null;

    if (order.paymentMethod) {
      paymentData = order;
    } else if (order.transactions?.length) {
      paymentData =
        order.transactions.find(
          tx => tx.status === 'Success' && tx.type === 'Pay'
        ) || order.transactions[0];
    }

    // console.log('paymentData 💜💜💜💜💜', paymentData);

    if (paymentData) {
      transaction.paymentDetails = {
        billingDetails: {
          name: order.customerName || null,
          email: order.customerEmail || null,
          phone: order.customerPhoneNumber || null,
          address: {
            city: order.billingAddress?.city ?? null,
            country: order.billingAddress?.countryCode ?? null,
            state: null,
            zip: order.billingAddress?.postCode ?? null
          }
        },
        last4: paymentData.paymentMethod?.maskedCardNumber?.slice(-4) ?? null,
        cardBrand: this.getCardBrandEnum(paymentData.paymentMethod?.brand)
      };
    }

    await transaction.save();

    await this.transactionLogService.createTransactionLog({
      transaction,
      changedBy: transaction.user,
      status: TransactionStatusEnum.SUCCESS,
      change: TransactionStateChangeEnum.TRANSACTION_FULFILLED
    });

    await this.walletService.handleWalletsStateMutations(transaction);

    let metadata: GeideaCustomMetadata = transaction.tempMetaData || {};

    if (metadata?.couponId) {
      await this.couponService.updateCouponUsageCount(metadata.couponId);
    }

    const resetCart = metadata?.resetCart || false;
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
      case 'MeezaDigital':
        return TransactionCardBrandEnum.MEEZA;
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
  async handlePaymentFailure(geideaWebhookPayload: any): Promise<void> {
    const order = geideaWebhookPayload.order;

    const remoteId = order.merchantReferenceId;

    if (!remoteId) {
      throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR);
    }

    const transaction =
      await this.transactionService.getTransactionByRemoteCheckoutSessionId(
        remoteId
      );

    // prevent duplicate webhook processing
    if (transaction.status !== TransactionStatusEnum.PENDING) {
      console.log('Webhook already processed, skipping...');
      return;
    }

    let failureReason =
      order?.detailedResponseMessage || order?.responseMessage || null;

    let failedTransaction = null;

    if (order.transactions?.length) {
      failedTransaction =
        order.transactions.find(tx => tx.status === 'Failed') ||
        order.transactions[0];
    }

    if (failedTransaction) {
      failureReason =
        failedTransaction?.codes?.detailedResponseMessage ||
        failedTransaction?.codes?.responseMessage ||
        failureReason;
    }

    transaction.status = TransactionStatusEnum.FAILED;
    transaction.failureReason = failureReason || 'Payment failed';

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

  // //! this will not be used, due to current business requirements
  // @Transactional()
  // async handlePaymentFailure(
  //   checkoutSession: Stripe.Checkout.Session
  // ): Promise<void> {
  //   const transaction =
  //     await this.transactionService.getTransactionByRemoteCheckoutSessionId(
  //       checkoutSession.id
  //     );

  //   const paymentIntent = await this.stripe.paymentIntents.retrieve(
  //     typeof checkoutSession.payment_intent === 'object' ?
  //       checkoutSession.payment_intent.id
  //     : checkoutSession.payment_intent
  //   );
  //   if (checkoutSession.status !== 'expired') {
  //     transaction.status =
  //       paymentIntent.status === 'canceled' ?
  //         TransactionStatusEnum.CANCELED
  //       : TransactionStatusEnum.FAILED;
  //     transaction.failureReason = paymentIntent.last_payment_error.message;
  //     await transaction.save();

  //     await this.transactionLogService.createTransactionLog({
  //       transaction,
  //       changedBy: transaction.user,
  //       status:
  //         paymentIntent.status === 'canceled' ?
  //           TransactionStatusEnum.CANCELED
  //         : TransactionStatusEnum.FAILED,
  //       change: TransactionStateChangeEnum.TRANSACTION_FAILED
  //     });
  //   } else {
  //     transaction.status = TransactionStatusEnum.EXPIRED;
  //     transaction.failureReason = paymentIntent.last_payment_error.message;
  //     await transaction.save();

  //     await this.transactionLogService.createTransactionLog({
  //       transaction,
  //       changedBy: transaction.user,
  //       status: TransactionStatusEnum.EXPIRED,
  //       change: TransactionStateChangeEnum.TRANSACTION_EXPIRED
  //     });
  //   }
  //   //TODO: handle the wallet state mutations
  //   //!there is no need to handle the wallet state mutations as we are only
  //   //!perform calculations after payment success not failure nor cancellation
  //   //!and a payment is impossible to transition from success to failure or cancellation
  // }

  //! this will not be used, due to current business requirements
  // @Transactional()
  // async handleRefundFailure(refund: Stripe.Refund): Promise<void> {
  //   const transaction =
  //     await this.transactionService.getTransactionByRemotePaymentIntentId(
  //       typeof refund.payment_intent === 'object' ?
  //         refund.payment_intent.id
  //       : refund.payment_intent
  //     );

  //   const paymentIntent = await this.stripe.paymentIntents.retrieve(
  //     typeof refund.payment_intent === 'object' ?
  //       refund.payment_intent.id
  //     : refund.payment_intent
  //   );

  //   //TODO: handle this case with special enum value REFUND_FAILURE
  //   transaction.status = TransactionStatusEnum.FAILED;
  //   transaction.failureReason = paymentIntent.last_payment_error.message;
  //   await transaction.save();

  //   await this.transactionLogService.createTransactionLog({
  //     transaction,
  //     changedBy: transaction.user,
  //     status: TransactionStatusEnum.FAILED,
  //     change: TransactionStateChangeEnum.TRANSACTION_FAILED
  //   });

  //   //TODO: handle the wallet state mutations
  //   //!there is no need to handle the wallet state mutations as we are only
  //   //!perform calculations after payment success not failure nor cancellation
  //   //!and a payment is impossible to transition from success to failure or cancellation
  // }

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
