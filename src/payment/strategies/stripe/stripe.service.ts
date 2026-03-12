import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import { Purchase } from '@src/cart/models/purchase.model';
import { CouponDiscountTypeEnum } from '@src/payment/enums/coupon.enums';
import {
  TransactionStateChangeEnum,
  TransactionStatusEnum
} from '@src/payment/enums/transaction-status.enum';
import { ICoupon } from '@src/payment/interfaces/coupon.interface';
import {
  IPaymentLinkResponse,
  TransactionStatusChangeResponse
} from '@src/payment/interfaces/payment-responses.interfaces';
import { IPaymentStrategy } from '@src/payment/interfaces/payment-strategy.interface';
import { IOrder } from '@src/payment/interfaces/product-line.interface';
import { Transaction } from '@src/payment/models/transaction.model';
import { RevenueShareService } from '@src/payment/services/revenue.service';
import { TransactionLogService } from '@src/payment/services/transaction-logs.service';
import { TransactionService } from '@src/payment/services/transaction.service';
import { WalletService } from '@src/payment/services/wallet.service';
import { SystemConfig } from '@src/system-configuration/models/system-config.model';
import { User } from '@src/user/models/user.model';
import { Queue } from 'bull';
import { log } from 'console';
import { env } from 'process';
import Stripe from 'stripe';
import {
  STRIPE_EXPLICIT_PAYMENT_FULFILLMENT_JOBS,
  STRIPE_HOOKS_QUEUE,
  STRIPE_PAYMENT_FAILURE_JOBS,
  STRIPE_PAYMENT_FULFILLMENT_JOBS
} from './queue/stripe-hooks.processor';
import { LangEnum } from '@src/user/user.enum';
import { TRANSACTION_FULFILLED_EVENT } from '@src/payment/constants/events-tokens.constants';
import { Transactional } from 'sequelize-transactional-typescript';
import { CouponService } from '@src/payment/services/coupon.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssignUserToLearningProgramEvent } from '@src/course/interfaces/assign-user.interface';
import { Coupon } from '@src/payment/models/coupons.model';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';

@Injectable()
export class StripeStrategy implements IPaymentStrategy {
  private vatPercentage: number;
  private readonly stripe: Stripe;
  private readonly stripeConfigs: Record<string, string> = {};
  constructor(
    @InjectQueue(STRIPE_HOOKS_QUEUE) private stripeQueue: Queue,
    @Inject(Repositories.PurchasesRepository)
    private readonly purchasesRepository: IRepository<Purchase>,
    @Inject(Repositories.CouponsRepository)
    private readonly couponsRepository: IRepository<Coupon>,
    @Inject(Repositories.TransactionsRepository)
    private readonly transactionsRepository: IRepository<Transaction>,
    private readonly revenueShareService: RevenueShareService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly transactionLogService: TransactionLogService,
    private readonly transactionService: TransactionService,
    private readonly helperService: HelperService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(Repositories.SystemConfigRepository)
    private readonly systemConfigsRepository: IRepository<SystemConfig>
  ) {
    this.stripeConfigs['success_url'] = this.configService.get<string>(
      'PAYMENT_SUCCESS_URL'
    );

    this.stripeConfigs['success_url_en'] = this.configService.get<string>(
      'PAYMENT_SUCCESS_URL_EN'
    );

    this.stripeConfigs['cancel_url'] =
      this.configService.get<string>('PAYMENT_CANCEL_URL');

    this.stripeConfigs['cancel_url_en'] = this.configService.get<string>(
      'PAYMENT_CANCEL_URL_EN'
    );

    this.stripeConfigs['currency'] =
      this.configService.get<string>('PAYMENT_CURRENCY') ?? 'usd';

    this.stripeConfigs['secretKey'] =
      this.configService.get<string>('STRIPE_SECRET_KEY');

    this.stripeConfigs['webhookSecret'] = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    );

    this.stripe = new Stripe(this.stripeConfigs.secretKey, {
      apiVersion: null as unknown as Stripe.LatestApiVersion
    });
  }

  async onModuleInit(): Promise<void> {
    this.vatPercentage =
      (await this.systemConfigsRepository.findOne({}))?.vat ?? 14;
  }

  async createCheckout<T extends IOrder>(
    order: T,
    customer: User,
    sessionId: string,
    lang?: LangEnum,
    resetCart: boolean = true
  ): Promise<IPaymentLinkResponse> {
    console.log('debugging_______lang______', lang, '______');
    console.log('resetCart', resetCart, String(resetCart));

    let isFreePayment = false;
    const transactionCode =
      await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.TRANSACTION,
        this.transactionsRepository
      );
    if (!order.purchaseItems.length) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }
    const customerAuthToken = this.helperService.generateAuthToken({
      userId: customer.id,
      sessionId
    });

    const purchase = await this.purchasesRepository.findOne({
      id: order.id
    });
    // 1. create product prices for stripe
    const products = order.purchaseItems;

    let totalOrderAmount = 0;
    const productLines: Array<{ price: string; quantity: number }> = [];
    for (const product of products) {
      for (const productInfo of product.productInfo) {
        log('productInfo.finalPrice', productInfo.finalPrice);
        //NOTE! this is commented out because current business requirements dictated how we integrate with stripe (need custom requirements and cases that stripe dose not cover)
        // const productPrice: Stripe.Product =
        //   productInfo.parentType !== LearningProgramTypeEnum.DIPLOMA ?
        //     await this.stripe.products.retrieve(productInfo.remoteProductId)
        //   : await this.stripe.products.create({
        //       name: productInfo.code,
        //       metadata: {
        //         localId: productInfo.id
        //       },
        //       default_price_data: {
        //         unit_amount: productInfo.finalPrice,
        //         currency: env.PAYMENT_CURRENCY
        //       }
        //     });

        totalOrderAmount += productInfo.finalPrice;

        // productLines.push({
        //   price:
        //     typeof productPrice.default_price === 'object' ?
        //       productPrice.default_price.id
        //     : productPrice.default_price,
        //   quantity: product.quantity
        // });
      }
    }
    console.log('RealTotalOrderAmount : ', totalOrderAmount);

    // cannot create payment intent for less than $0.5
    if (totalOrderAmount <= 0) {
      totalOrderAmount = 0;
    } else if (totalOrderAmount < 0.5 * 100) {
      totalOrderAmount = 0.5 * 100;
    }

    console.log('FinalTotalOrderAmount : ', totalOrderAmount);

    const productPrice: Stripe.Product = await this.stripe.products.create({
      name: 'Total Amount',
      default_price_data: {
        unit_amount: totalOrderAmount,
        currency: env.PAYMENT_CURRENCY
      }
    });

    productLines.push({
      price:
        typeof productPrice.default_price === 'object' ?
          productPrice.default_price.id
        : productPrice.default_price,
      quantity: 1
    });

    // //1.2 add custom vat
    // if (
    //   !(
    //     order?.coupon?.discountType === CouponDiscountTypeEnum.PERCENTAGE &&
    //     order?.coupon?.discountOff === 100
    //   )
    // ) {
    //   const vatPrice = await this.stripe.products.create({
    //     name: `VAT %${this.vatPercentage}`,
    //     default_price_data: {
    //       unit_amount: Math.floor(
    //         (totalOrderAmount * this.vatPercentage) /
    //           (1 + this.vatPercentage) /
    //           100
    //       ),
    //       currency: env.PAYMENT_CURRENCY
    //     }
    //   });
    //   productLines.push({
    //     price:
    //       typeof vatPrice.default_price === 'object' ?
    //         vatPrice.default_price.id
    //       : vatPrice.default_price,
    //     quantity: 1
    //   });
    // } else {
    //   isFreeCoupon = true;
    //   isFreePayment = true;
    // }
    console.log(
      'lang',
      lang,
      'success_url',
      lang === LangEnum.EN ?
        this.stripeConfigs.success_url_en
      : this.stripeConfigs.success_url
    );

    //2. create checkout session
    const checkoutSession = await this.stripe.checkout.sessions.create({
      line_items: productLines,

      success_url: (lang === LangEnum.EN ?
        this.stripeConfigs.success_url_en
      : this.stripeConfigs.success_url
      )
        .concat(customerAuthToken)
        .concat(`&code=${transactionCode}`),

      cancel_url: (lang === LangEnum.EN ?
        this.stripeConfigs.cancel_url_en
      : this.stripeConfigs.cancel_url
      )
        .concat(customerAuthToken)
        .concat(`&code=${transactionCode}`),
      mode: 'payment',
      metadata: {
        couponId: order.coupon?.id,
        resetCart: String(resetCart)
      }
      // metadata: {
      //   userId: customer.id,
      //   purchaseId: purchase.id,
      //   ...(order.coupon?.remoteCouponId && {
      //     couponId: order.coupon.id
      //   })
      // },
      // ...(order.coupon?.remoteCouponId && {
      //   discounts: [
      //     {
      //       promotion_code: order.coupon.remoteCouponId
      //     }
      //   ]
      // })
    });

    if (checkoutSession.amount_total <= 0) {
      isFreePayment = true;
    }

    //3. create transaction
    const transaction = await this.transactionService.createTransaction({
      status: TransactionStatusEnum.PENDING,
      code: transactionCode,
      ...(await this.transactionService.generateTransactionTitle(purchase)),
      totalAmount: checkoutSession.amount_total,
      remoteCheckoutSessionId: checkoutSession.id,
      userId: customer.id,
      user: customer,
      purchase,
      purchaseId: purchase.id
    });

    // await this.transactionLogService.createTransactionLog({
    //   transaction,
    //   changedBy: customer,
    //   status: TransactionStatusEnum.PENDING,
    //   change: TransactionStateChangeEnum.TRANSACTION_CREATED
    // });

    //4. create revenue shares for the transaction
    // console.log(products)
    // console.log('--------------')
    const revenueShares =
      await this.revenueShareService.getRevenueSharesForTransaction(
        products,
        transaction
      );

    //5. save revenue shares to the transaction
    transaction.revenueShares = revenueShares;
    await transaction.save();

    //6. link Transaction to wallets
    await this.walletService.linkWalletsToTransaction(transaction);

    // if (isFreePayment) {
    //   await this.stripeQueue.add(
    //     STRIPE_EXPLICIT_PAYMENT_FULFILLMENT_JOBS,
    //     { transactionId: transaction.id, isFreePayment },
    //     // //TODO: add delay to this job
    //     { delay: 0 }
    //   );
    // }

    return {
      paymentLink: checkoutSession.url
    };
  }

  async createPaymentIntent<T extends IOrder>(
    order: T,
    customer: User,
    sessionId: string,
    lang?: LangEnum,
    resetCart: boolean = true
  ): Promise<{ paymentIntentId: string; paymentIntentSecretKey: string }> {
    if (!order.purchaseItems.length) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    const transactionCode =
      await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.TRANSACTION,
        this.transactionsRepository
      );

    const purchase = await this.purchasesRepository.findOne({ id: order.id });
    const products = order.purchaseItems;

    let totalOrderAmount = 0;
    for (const product of products) {
      for (const productInfo of product.productInfo) {
        totalOrderAmount += productInfo.finalPrice;
      }
    }

    if (totalOrderAmount <= 0) {
      /**
       * Stripe doesn't allow creating payment intent for less than $0.5,
       * so we need to handle it manually as a free transaction.
       */

      const freeTransaction = await this.transactionService.createTransaction({
        status: TransactionStatusEnum.PENDING,
        code: transactionCode,
        ...(await this.transactionService.generateTransactionTitle(purchase)),
        totalAmount: totalOrderAmount || 0,
        userId: customer.id,
        user: customer,
        purchase,
        purchaseId: purchase.id
      });

      const revenueShares =
        await this.revenueShareService.getRevenueSharesForTransaction(
          products,
          freeTransaction
        );

      freeTransaction.revenueShares = revenueShares;
      await freeTransaction.save();

      await this.walletService.linkWalletsToTransaction(freeTransaction);

      await freeTransaction.save();

      try {
        await this.handlePaymentFulfillmentLocal(
          freeTransaction,
          {
            couponId: order?.coupon?.id,
            resetCart: String(resetCart)
          },
          products
        );
      } catch (err) {
        console.log('error in handlePaymentFulfillmentLocal :', err);
      }

      return {
        paymentIntentId: null,
        paymentIntentSecretKey: null
      };
    } else if (totalOrderAmount < 0.5 * 100) {  
      totalOrderAmount = 0.5 * 100;
    }

    const paymentIntentObj = await this.stripe.paymentIntents.create({
      amount: totalOrderAmount,
      currency: env.PAYMENT_CURRENCY,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        couponId: order.coupon?.id,
        resetCart: String(resetCart)
      }
    });

    const transaction = await this.transactionService.createTransaction({
      status: TransactionStatusEnum.PENDING,
      code: transactionCode,
      ...(await this.transactionService.generateTransactionTitle(purchase)),
      totalAmount: totalOrderAmount,
      remoteTransactionId: paymentIntentObj.id,
      userId: customer.id,
      user: customer,
      purchase,
      purchaseId: purchase.id
    });

    const revenueShares =
      await this.revenueShareService.getRevenueSharesForTransaction(
        products,
        transaction
      );

    transaction.revenueShares = revenueShares;
    await transaction.save();

    await this.walletService.linkWalletsToTransaction(transaction);

    return {
      paymentIntentId: paymentIntentObj.id,
      paymentIntentSecretKey: paymentIntentObj.client_secret
    };
  }

  // @Transactional()
  async handlePaymentFulfillmentLocal(
    transaction: Transaction,
    metadata: { couponId?: string; resetCart?: string },
    products: any
  ): Promise<void> {
    transaction.status = TransactionStatusEnum.SUCCESS;
    await transaction.save();
    await this.transactionLogService.createTransactionLog({
      transaction,
      changedBy: transaction.user,
      status: TransactionStatusEnum.SUCCESS,
      change: TransactionStateChangeEnum.TRANSACTION_FULFILLED
    });

    const revenueShares =
      await this.revenueShareService.getRevenueSharesForTransaction(
        products,
        transaction
      );

    transaction.revenueShares = revenueShares;

    await transaction.save();
    await this.walletService.handleWalletsStateMutations(transaction);

    if (metadata.couponId) {
      await this.updateCouponUsageCount(metadata.couponId);
    }

    const transactionWithJoins = await this.transactionsRepository.findOne(
      {
        id: transaction.dataValues.id
      },
      [
        {
          model: User,
          as: 'user',
          attributes: ['id']
        },
        {
          model: Purchase,
          as: 'purchase',
          include: [
            {
              model: PurchaseItem,
              attributes: ['learningProgramId', 'type']
            }
          ]
        }
      ]
    );

    const resetCart = metadata.resetCart === 'true';
    this.eventEmitter.emitAsync(
      TRANSACTION_FULFILLED_EVENT,
      this.getTransactionFulfilledEventPayload(transactionWithJoins, resetCart)
    );
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: 'pm_card_visa'
      }
    );
    return paymentIntent.status === 'succeeded' ? true : false;
  }

  //TODO: we must add user param referencing to the user who is making the change (admin, customer)
  async refund(
    transaction: Transaction,
    actionTakenBy: User,
    amount?: number
  ): Promise<TransactionStatusChangeResponse> {
    //! this is commented out because we are not using stripe refunds
    //! in current business requirements.
    try {
      const refund = await this.stripe.refunds.create({
        amount: amount ?? transaction.totalAmount,
        payment_intent: transaction.dataValues.remoteTransactionId
      });
    } catch (err) {
      console.error(err);
    }

    //1. update transaction status to refunded
    transaction.status = TransactionStatusEnum.REFUNDED;
    await transaction.save();

    await this.transactionLogService.createTransactionLog({
      transaction,
      changedBy: actionTakenBy,
      status: TransactionStatusEnum.REFUNDED,
      change: TransactionStateChangeEnum.REFUND_USER
    });

    //2. update wallets state
    await this.walletService.handleWalletsStateMutations(transaction);

    return {
      status: TransactionStatusEnum.REFUNDED
    };
  }

  async cancel(
    transaction: Transaction,
    actionTakenBy: User
  ): Promise<TransactionStatusChangeResponse> {
    //1. update transaction status to canceled
    transaction.status = TransactionStatusEnum.CANCELED;
    await transaction.save();

    await this.transactionLogService.createTransactionLog({
      transaction,
      changedBy: actionTakenBy,
      status: TransactionStatusEnum.CANCELED,
      change: TransactionStateChangeEnum.CANCEL_PAYOUT
    });

    //2. update wallets state
    await this.walletService.handleWalletsStateMutations(transaction);

    return {
      status: TransactionStatusEnum.CANCELED
    };
  }

  async createRemoteCoupon(coupon: ICoupon): Promise<string> {
    const stripeCoupon = await this.stripe.coupons.create({
      ...(coupon.discountType === CouponDiscountTypeEnum.AMOUNT ?
        { amount_off: coupon.discountOff * 100 }
      : { percent_off: coupon.discountOff }),
      redeem_by: coupon.endDate.getTime() / 1000,
      max_redemptions: coupon.redeemableCount ?? 100 * 1000,
      currency: this.stripeConfigs.currency,
      ...(coupon.remoteApplicableFor && {
        applies_to: {
          products: coupon.remoteApplicableFor
        }
      }),
      name: coupon.code
    });
    return (
      await this.stripe.promotionCodes.create({
        coupon: stripeCoupon.id,
        restrictions: {
          minimum_amount: coupon.minimumAmount < 1 ? 1 : coupon.minimumAmount,
          first_time_transaction: coupon.redeemableOnce,
          minimum_amount_currency: this.stripeConfigs.currency
        },
        code: coupon.code
      })
    ).id;
  }

  async updateRemoteCoupon(coupon: ICoupon): Promise<string> {
    await this.deleteRemoteCoupon(coupon);
    return await this.createRemoteCoupon(coupon);
  }

  updateRemoteCouponApplicability(coupon: ICoupon): void {
    console.log(
      'updateRemoteCouponApplicability method is not implemented yet'
    );
  }
  async updateRemoteCouponStatus(
    coupon: ICoupon,
    activate: boolean
  ): Promise<string> {
    const promoCode = await this.stripe.promotionCodes.retrieve(
      coupon.remoteCouponId
    );
    await this.stripe.promotionCodes.update(promoCode.id, {
      active: activate
    });

    return promoCode.id;
  }

  async deleteRemoteCoupon(coupon: ICoupon): Promise<void> {
    const promoCode = await this.stripe.promotionCodes.retrieve(
      coupon.remoteCouponId
    );
    await this.stripe.promotionCodes.update(promoCode.id, {
      active: false
    });
  }

  //NOTE this method is where we handle all our wallets state mutations and transactions state mutations
  async handlePaymentEvent(
    req: RawBodyRequest<Request>,
    sig: string
  ): Promise<void> {
    let event: Stripe.Event;
    console.log(
      'debugging_______req.rawBody______',
      JSON.parse(req.rawBody.toString('utf-8')).data.object?.amount_total
    );
    if (
      JSON.parse(req.rawBody.toString('utf-8')).data?.object?.amount_total === 0
    ) {
      await this.stripeQueue.add(
        STRIPE_PAYMENT_FULFILLMENT_JOBS,
        JSON.parse(req.rawBody.toString('utf-8'))?.data?.object,
        // //TODO: add delay to this job
        { delay: 0 }
      );
    }
    console.log('debugging_______req.rawBody______');
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        this.stripeConfigs.webhookSecret
      );
    } catch (err) {
      console.error('🚨 Webhook Error:', err.message);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    console.log('✅ Webhook Received: outter', event.type); // Debug logs

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      console.log(
        '✅ Checkout Session Completed Event: INNER',
        event.data.object
      );
      await this.stripeQueue.add(
        STRIPE_PAYMENT_FULFILLMENT_JOBS,
        event.data.object,
        // //TODO: add delay to this job
        { delay: 0 }
      );
    }

    if (event.type === 'payment_intent.succeeded') {
      console.log('✅ PaymentIntent Succeeded Event:', event.data.object);
      await this.stripeQueue.add(
        STRIPE_PAYMENT_FULFILLMENT_JOBS,
        event.data.object,
        { delay: 0 }
      );
    }

    // if (event.type === 'payment_intent.succeeded') {
    //   console.log('✅ PaymentIntent Event: INNER', event.data.object);
    //   await this.stripeQueue.add(
    //     STRIPE_PAYMENT_FULFILLMENT_JOBS,
    //     event.data.object,
    //     //TODO: add delay to this job
    //     { delay: 1 * 1000 }
    //   );
    // }

    if (
      event.type === 'payment_intent.canceled' ||
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'checkout.session.async_payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      await this.stripeQueue.add(
        STRIPE_PAYMENT_FAILURE_JOBS,
        event.data.object
        // //TODO: add delay to this job
        // { delay: 0 }
      );
    }

    //! NOTE: this is commented out because we are not using stripe refunds
    //! in current business requirements.
    //Handle refund events
    // if (event.type === 'refund.failed') {
    //   await this.stripeQueue.add(
    //   STRIPE_REFUND_FAILURE_JOBS,
    //   event.data.object,
    //   //TODO: add delay to this job
    //   { delay: 0 }
    // );
    // }
  }

  getTransactionFulfilledEventPayload(
    transaction: Transaction,
    resetCart = false
  ): AssignUserToLearningProgramEvent {
    const event = new AssignUserToLearningProgramEvent();
    event.userId = transaction?.user?.id;
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

  async updateCouponUsageCount(id: string): Promise<Coupon> {
    console.log('debugging_______usageCount ++ ______');
    const coupon = await this.couponsRepository.findOne({ id });
    if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
    return await this.couponsRepository.updateOneFromExistingModel(coupon, {
      // redeemableCount:
      //   coupon.redeemableCount > 0 ? coupon.redeemableCount - 1 : 0,
      timesUsed: coupon.timesUsed + 1
    });
  }
}
