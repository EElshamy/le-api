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
import {
  GEIDEA_HOOKS_QUEUE,
  GEIDEA_PAYMENT_FAILURE_JOBS,
  GEIDEA_PAYMENT_FULFILLMENT_JOBS
} from './queue/geidea-hooks.processor';
import { LangEnum } from '@src/user/user.enum';
import { TRANSACTION_FULFILLED_EVENT } from '@src/payment/constants/events-tokens.constants';
import { Transactional } from 'sequelize-transactional-typescript';
import { CouponService } from '@src/payment/services/coupon.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssignUserToLearningProgramEvent } from '@src/course/interfaces/assign-user.interface';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import * as crypto from 'crypto';
import axios from 'axios';
import { Coupon } from '@src/payment/models/coupons.model';

@Injectable()
export class GeideaStrategy implements IPaymentStrategy {
  private vatPercentage: number;
  // private readonly stripe: Stripe;
  private readonly geideaConfigs: Record<string, string>;
  constructor(
    @InjectQueue(GEIDEA_HOOKS_QUEUE) private geideaQueue: Queue,
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
    this.geideaConfigs = {
      merchant_id: this.configService.get<string>('GEIDEA_MERCHANT_ID'),
      api_password: this.configService.get<string>('GEIDEA_API_PASSWORD'),
      api_url: this.configService.get<string>('GEIDEA_API_URL'),
      webhook_url: this.configService.get<string>('GEIDEA_CALLBACK_URL'),
      success_url: this.configService.get<string>('GEIDEA_SUCCESS_URL'),
      failure_url: this.configService.get<string>('GEIDEA_FAILURE_URL'),
      currency: this.configService.get<string>('GEIDEA_CURRENCY'),
      refund_url: this.configService.get<string>('GEIDEA_REFUND_API')
    };
  }

  async onModuleInit(): Promise<void> {
    this.vatPercentage =
      (await this.systemConfigsRepository.findOne({}))?.vat ?? 14;
  }

  /**
   * Step 1: Create the Geidea eInvoice Payment Request (instead of session)
   */
  private async makeGeideaPaymentRequest(paymentRequest: any): Promise<{
    paymentLink: string;
    paymentIntentId: string;
    merchantReferenceId: string;
  }> {
    const apiUrl = this.geideaConfigs['api_url'];
    const merchantId = this.geideaConfigs['merchant_id'];
    const apiPassword = this.geideaConfigs['api_password'];

    if (!apiUrl || !merchantId || !apiPassword) {
      throw new BaseHttpException(
        ErrorCodeEnum.PAYMENT_ERROR,
        'Missing Geidea configurations'
      );
    }

    const authHeader = `Basic ${Buffer.from(`${merchantId}:${apiPassword}`).toString('base64')}`;

    // Calculate total
    const amount = Math.round(paymentRequest.amount);

    const fullRequestBody = {
      amount,
      currency: paymentRequest.currency,
      customer: {
        name: paymentRequest.customer?.name || 'Customer',
        email: paymentRequest.customer?.email || 'customer@email.com',
        phoneCountryCode: '+20',
        phoneNumber: paymentRequest.customer?.phoneNumber || '01000000000'
      },
      eInvoiceDetails: {
        subtotal: amount,
        grandTotal: amount,
        extraChargesType: 'Amount',
        invoiceDiscountType: 'Amount',
        callbackurl: paymentRequest.callbackUrl,
        merchantReferenceId: paymentRequest.merchantReferenceId,
        eInvoiceItems: paymentRequest.items.map((item: any) => ({
          eInvoiceItemId: item.id,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          itemDiscountType: 'Amount',
          taxType: 'Amount',
          total: item.price * item.quantity
        }))
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify(fullRequestBody)
      });

      const data = await response.json();
      console.log('📥 [GEIDEA] eInvoice response:', data);

      if (!response.ok || data.responseCode !== '000') {
        throw new BaseHttpException(
          ErrorCodeEnum.PAYMENT_ERROR,
          `Geidea error: ${data.detailedResponseMessage || data.responseMessage || 'Unknown error'}`
        );
      }

      return {
        paymentLink: data.paymentIntent?.link,
        paymentIntentId: data.paymentIntent.paymentIntentId,
        merchantReferenceId:
          data.paymentIntent.eInvoiceDetails.merchantReferenceId
      };
    } catch (error) {
      console.error('💥 [GEIDEA] eInvoice error:', error);
      throw new BaseHttpException(
        ErrorCodeEnum.PAYMENT_ERROR,
        `Failed to create Geidea eInvoice: ${error.message}`
      );
    }
  }

  /**
   * Step 2: Create the checkout using Geidea eInvoice
   */
  async createCheckout<T extends IOrder>(
    order: T,
    customer: User,
    sessionId: string,
    lang?: LangEnum,
    resetCart: boolean = true
  ): Promise<IPaymentLinkResponse> {
    console.log('debugging_______lang______', lang, '______');
    console.log('resetCart', resetCart, String(resetCart));
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

    const purchase = await this.purchasesRepository.findOne({ id: order.id });
    if (!purchase) {
      throw new BaseHttpException(ErrorCodeEnum.UNKNOWN_ERROR);
    }

    const products = order.purchaseItems;
    let totalOrderAmount = 0;
    const invoiceItems = [];

    for (const product of products) {
      for (const productInfo of product.productInfo) {
        totalOrderAmount += productInfo.finalPrice;
        invoiceItems.push({
          id: productInfo.id,
          description: productInfo.enTitle,
          price: productInfo.finalPrice / 100,
          quantity: 1 // adjust as needed
        });
      }
    }

    console.log('RealTotalOrderAmount : ', totalOrderAmount);

    // cannot create payment intent for less than $0.1
    if (totalOrderAmount <= 0) {
      /**
       * gedia doesn't allow creating checkout for less than $0.01,
       * so we need to handle it manually as a free transaction.
       */

      const { vatPercentage, paymentGatewayVatPercentage } =
        await this.getVatValues();

      const freeTransaction = await this.transactionService.createTransaction({
        status: TransactionStatusEnum.PENDING,
        code: transactionCode,
        ...(await this.transactionService.generateTransactionTitle(purchase)),
        totalAmount: totalOrderAmount || 0,
        userId: customer.id,
        user: customer,
        purchase,
        purchaseId: purchase.id,
        vat: vatPercentage,
        gatewayVat: paymentGatewayVatPercentage
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
        paymentLink: null
      };
    }
    console.log('FinalTotalOrderAmount : ', totalOrderAmount);

    //! the bussiness need the currency in USD, but the user pay in EGP
    let amountToCharge = totalOrderAmount / 100;
    let currency = this.geideaConfigs['currency'];
    let finalInvoiceItems = invoiceItems;
    const paymentRequest = {
      amount: amountToCharge,
      currency: 'EGP',
      orderId: transactionCode,
      customer: {
        name: customer.enFullName,
        email: customer.email
        // phoneNumber: customer.phone
      },
      callbackUrl: this.geideaConfigs['webhook_url'],
      // there is no metadata in geidea, so we do this
      // custom: JSON.stringify({
      //   couponId: order.coupon?.id,
      //   resetCart
      // }),
      merchantReferenceId: order.id,
      items: finalInvoiceItems
    };

    const response = await this.makeGeideaPaymentRequest(paymentRequest);

    const { vatPercentage, paymentGatewayVatPercentage } =
      await this.getVatValues();

    const transaction = await this.transactionService.createTransaction({
      status: TransactionStatusEnum.PENDING,
      code: transactionCode,
      ...(await this.transactionService.generateTransactionTitle(purchase)),
      totalAmount: totalOrderAmount,
      remoteCheckoutSessionId: response.merchantReferenceId,
      userId: customer.id,
      user: customer,
      purchase,
      purchaseId: purchase.id,
      vat: vatPercentage,
      gatewayVat: paymentGatewayVatPercentage,
      // there is no meta data in geidea, so we do this
      tempMetaData: {
        couponId: order?.coupon?.id,
        resetCart
      }
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
      paymentLink: response.paymentLink
    };
  }

  // async handlePaymentFulfillmentLocal(
  //   transaction: Transaction,
  //   metadata: { couponId?: string; resetCart?: boolean },
  //   products: any
  // ): Promise<void> {
  //   console.log('debugging_______handlePaymentFulfillmentLocal______', metadata, '______');

  //   // Update transaction status
  //   transaction.status = TransactionStatusEnum.SUCCESS;
  //   await transaction.save();

  //   // Create transaction log
  //   await this.transactionLogService.createTransactionLog({
  //     transaction,
  //     changedBy: transaction.user,
  //     status: TransactionStatusEnum.SUCCESS,
  //     change: TransactionStateChangeEnum.TRANSACTION_FULFILLED
  //   });

  //   // Create revenue shares for the transaction
  //   const revenueShares =
  //     await this.revenueShareService.getRevenueSharesForTransaction(
  //       products,
  //       transaction
  //     );

  //   // Save revenue shares to the transaction
  //   transaction.revenueShares = revenueShares;
  //   await transaction.save();

  //   // Link Transaction to wallets
  //   await this.walletService.linkWalletsToTransaction(transaction);

  //   // Emit transaction fulfilled event
  //   await this.eventEmitter.emitAsync(
  //     TRANSACTION_FULFILLED_EVENT,
  //     this.getTransactionFulfilledEventPayload(transaction, metadata.resetCart)
  //   );
  // }

  async handlePaymentEvent(req: RawBodyRequest<Request>): Promise<void> {
    try {
      const body = req.body as any;

      // console.log('Received Geidea webhook 💛:', body);
      // console.log('--------------');

      // verify signature
      if (!this.verifyGeideaWebhookSignature(body)) {
        throw new Error('Invalid Geidea signature');
      }

      const order = body?.order;

      if (!order) {
        console.log('No order in webhook, ignoring...');
        return;
      }

      // console.log('order 🩵:', order);
      // console.log('--------------');

      // get last transaction (most reliable status)
      const lastTransaction =
        order.transactions?.[order.transactions.length - 1];

      // console.log('lastTransaction:', lastTransaction);
      // console.log('--------------');

      const statusResult = lastTransaction?.status || order?.status || null;

      const isSuccess = statusResult === 'Success';

      const isFailed = ['Failed', 'Cancelled', 'Declined'].includes(
        statusResult
      );

      // console.log('statusResult:', statusResult);
      // console.log('isSuccess:', isSuccess);
      // console.log('isFailed:', isFailed);
      // console.log('--------------');

      if (isSuccess) {
        await this.geideaQueue.add(GEIDEA_PAYMENT_FULFILLMENT_JOBS, body, {
          delay: 0
        });
      } else if (isFailed) {
        await this.geideaQueue.add(GEIDEA_PAYMENT_FAILURE_JOBS, body, {
          delay: 0
        });
      }
    } catch (error) {
      console.error('Geidea Webhook Error:', error.message);
      throw new Error('Geidea Webhook Error: ' + error.message);
    }
  }

  async refund(
    transaction: Transaction,
    actionTakenBy: User,
    amount?: number
  ): Promise<TransactionStatusChangeResponse> {
    try {
      const refundAmount = amount ?? transaction.totalAmount;
      const orderId = transaction.dataValues.remoteTransactionId;

      // if (refundAmount > 0 && orderId) {
      //   const result = await this.refundFromGeidea(orderId, refundAmount);
      // }

      transaction.status = TransactionStatusEnum.REFUNDED;
      await transaction.save();

      await this.transactionLogService.createTransactionLog({
        transaction,
        changedBy: actionTakenBy,
        status: TransactionStatusEnum.REFUNDED,
        change: TransactionStateChangeEnum.REFUND_USER
      });

      await this.walletService.handleWalletsStateMutations(transaction);

      return {
        status: TransactionStatusEnum.REFUNDED
      };
    } catch (err) {
      console.error('Refund error:', err);
      throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR);
    }
  }

  private async refundFromGeidea(orderId: string, amount: number) {
    const amountFormatted = Number(amount / 100).toFixed(2);
    const timestamp = new Date().toISOString();

    const signature = this.generateSignatureForRefund(
      timestamp,
      this.geideaConfigs.merchant_id,
      amountFormatted,
      orderId,
      this.geideaConfigs.api_password
    );

    const body = {
      orderId,
      refundAmount: amountFormatted,
      // currency: this.geideaConfigs.currency,
      // reason: 'Customer requested refund',
      // timestamp,
      signature
      // customer: {
      //   email: 'customer@example.com',
      //   name: 'Customer'
      // }
    };

    console.log('Geidea refund body:', body);

    console.log('Geidea refund url:', this.geideaConfigs.refund_url);

    const response = await fetch(this.geideaConfigs.refund_url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${this.generateAuthHeader()}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log('Geidea refund result:', result);

    if (!response.ok || result.detailedResponseCode !== '000') {
      console.error('Geidea refund failed:', result);
      throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR);
    }

    return result;
  }

  private generateAuthHeader(): string {
    const authString = `${this.geideaConfigs.merchant_id}:${this.geideaConfigs.api_password}`;
    return Buffer.from(authString).toString('base64');
  }

  generateSignatureForRefund(
    timestamp: string,
    merchantId: string,
    refundAmount: string,
    orderId: string,
    secretKey: string
  ): string {
    const stringToSign = `${timestamp}${merchantId}${refundAmount}${orderId}`;

    return crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('base64');
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

  async createRemoteCoupon(
    coupon: ICoupon
  ): Promise<ICoupon['remoteCouponId']> {
    // throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR, 'Not implemented');
    return '';
  }

  async updateRemoteCouponStatus(
    coupon: ICoupon,
    activate: boolean
  ): Promise<ICoupon['remoteCouponId']> {
    // throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR, 'Not implemented');
    return '';
  }

  async updateRemoteCoupon(
    coupon: ICoupon
  ): Promise<ICoupon['remoteCouponId']> {
    // throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR, 'Not implemented');
    return '';
  }

  updateRemoteCouponApplicability(coupon: ICoupon): void {
    // throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR, 'Not implemented');
  }

  async deleteRemoteCoupon(coupon: ICoupon): Promise<void> {
    // throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR, 'Not implemented');
  }

  async updateCouponUsageCount(couponId: string): Promise<void> {
    const coupon = await this.couponsRepository.findOne({ id: couponId });
    if (!coupon) {
      throw new BaseHttpException(ErrorCodeEnum.UNKNOWN_ERROR);
    }
    await this.couponsRepository.updateOne(
      { id: couponId },
      {
        // redeemableCount:
        //   coupon.redeemableCount > 0 ? coupon.redeemableCount - 1 : 0,
        timesUsed: coupon.timesUsed + 1
      }
    );
  }
  // Handle refund events
  // if (event.type === 'refund.failed') {
  //   await this.geideaQueue.add(
  //   GEIDEA_REFUND_FAILURE_JOBS,
  //   event.data.object,
  //   //TODO: add delay to this job
  getTransactionFulfilledEventPayload(
    transaction: Transaction,
    resetCart = false
  ): AssignUserToLearningProgramEvent {
    return {
      userId: transaction.user.id,
      learningPrograms: transaction.purchase.purchaseItems.map(item => ({
        learningProgramId: item.learningProgramId,
        learningProgramType: item.type
      })),
      resetCart
    };
  }

  async getConversionRate(from: string, to: string): Promise<number> {
    try {
      const { data } = await axios.get(
        `https://open.er-api.com/v6/latest/${from}`
      );

      if (!data || !data.rates || !data.rates[to]) {
        throw new Error('Invalid response from exchange rate API');
      }

      // console.log('data : ', data);

      return data.rates[to];
    } catch (error) {
      console.error('Error fetching conversion rate:', error.message);
      throw new Error('Currency conversion failed');
    }
  }

  // async getConversionRate(from: string, to: string): Promise<number> {
  //   try {
  //     const { data } = await axios.get(`https://api.exchangerate.host/latest`, {
  //       params: {
  //         base: from,
  //         symbols: to
  //       }
  //     });

  //     if (!data || !data.rates || !data.rates[to]) {
  //       console.error('API response:', data); // debug log
  //       throw new Error('Invalid response from exchange rate API');
  //     }

  //     console.log('Conversion rate data:', data);

  //     return data.rates[to];
  //   } catch (error: any) {
  //     console.error('Error fetching conversion rate:', error.message);
  //     throw new Error('Currency conversion failed');
  //   }
  // }
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

  async createPaymentIntent<T extends IOrder>(
    order: T,
    customer: User,
    sessionId: string,
    lang: LangEnum = LangEnum.EN,
    resetCart: boolean = true
  ): Promise<{
    paymentIntentId?: string;
    paymentIntentSecretKey?: string;
    paymentLink?: string;
    transactionCode?: string;
  }> {
    if (!order.purchaseItems.length) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    const transactionCode =
      await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.TRANSACTION,
        this.transactionsRepository
      );

    const purchase = await this.purchasesRepository.findOne({ id: order.id });
    if (!purchase) {
      throw new BaseHttpException(ErrorCodeEnum.UNKNOWN_ERROR);
    }

    // console.log('💛 purchase : ');
    // console.log(JSON.stringify(purchase, null, 2));
    // console.log('----------------------');

    const products = order.purchaseItems;
    let totalOrderAmount = 0;

    for (const product of order.purchaseItems) {
      for (const productInfo of product.productInfo) {
        totalOrderAmount += productInfo.finalPrice;
      }
    }

    totalOrderAmount = Math.max(totalOrderAmount, 0);

    console.log('RealTotalOrderAmount : ', totalOrderAmount);

    // cannot create payment intent for less than $0.5
    if (totalOrderAmount <= 0) {
      /**
       * gedia doesn't allow creating checkout for less than $0.01,
       * so we need to handle it manually as a free transaction.
       */

      console.log('creating free transaction');
      console.log('totalOrderAmount : ', totalOrderAmount);
      console.log('couponId : ', order?.coupon?.id);

      const { vatPercentage, paymentGatewayVatPercentage } =
        await this.getVatValues();

      const freeTransaction = await this.transactionService.createTransaction({
        status: TransactionStatusEnum.PENDING,
        code: transactionCode,
        ...(await this.transactionService.generateTransactionTitle(purchase)),
        totalAmount: totalOrderAmount || 0,
        userId: customer.id,
        user: customer,
        purchase,
        purchaseId: purchase.id,
        vat: vatPercentage,
        gatewayVat: paymentGatewayVatPercentage
      });

      const revenueShares =
        await this.revenueShareService.getRevenueSharesForTransaction(
          products,
          freeTransaction
        );

      // console.log('🩷 revenueShares : ');
      // console.log(JSON.stringify(revenueShares, null, 2));

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
        paymentLink: null,
        paymentIntentId: null,
        paymentIntentSecretKey: null,
        transactionCode: transactionCode
      };
    }

    let currency = this.geideaConfigs['currency'];
    let amountToCharge = totalOrderAmount / 100;

    console.log('🧮 Original amount in', currency, ':', amountToCharge);

    // Convert USD to EGP if needed
    if (currency === 'USD') {
      const usdToEgpRate = await this.getConversionRate('USD', 'EGP');
      console.log('💱 USD to EGP rate:', usdToEgpRate);
      amountToCharge = +(amountToCharge * usdToEgpRate).toFixed(2);
      currency = 'EGP';
      console.log('💵 Converted amount in EGP:', amountToCharge);
    }

    const formattedAmount = amountToCharge.toFixed(2);
    const timestamp = new Date().toISOString();
    const webhook_url = this.geideaConfigs['webhook_url'];

    const signature = this.generateSignatureForSession(
      this.geideaConfigs.merchant_id,
      formattedAmount,
      currency,
      order.id,
      timestamp,
      this.geideaConfigs.api_password
    );

    const requestBody = {
      amount: parseFloat(formattedAmount),
      currency,
      timestamp,
      returnUrl: `${this.geideaConfigs['success_url']}?code=${transactionCode}`,
      merchantReferenceId: order.id,
      signature,
      callbackUrl: webhook_url,
      language: lang,
      customer: {
        name: customer.enFullName,
        email: customer.email
        // phoneNumber: customer.phone
      }
    };

    const response = await fetch(
      'https://api.merchant.geidea.net/payment-intent/api/v2/direct/session',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Basic ${this.generateAuthHeader()}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    const responseText = await response.text();

    try {
      const result = JSON.parse(responseText);

      console.log('Geidea Response:', result);

      const { vatPercentage, paymentGatewayVatPercentage } =
        await this.getVatValues();

      if (result.session) {
        const transaction = await this.transactionService.createTransaction({
          status: TransactionStatusEnum.PENDING,
          code: transactionCode,
          ...(await this.transactionService.generateTransactionTitle(purchase)),
          totalAmount: totalOrderAmount,
          remoteCheckoutSessionId: result.session.merchantReferenceId,
          userId: customer.id,
          user: customer,
          purchase,
          purchaseId: purchase.id,
          vat: vatPercentage,
          gatewayVat: paymentGatewayVatPercentage,
          tempMetaData: {
            couponId: order?.coupon?.id,
            resetCart
          }
        });

        const revenueShares =
          await this.revenueShareService.getRevenueSharesForTransaction(
            order.purchaseItems,
            transaction
          );

        // console.log('🩷 revenueShares : ');
        // console.log(JSON.stringify(revenueShares, null, 2));
        transaction.revenueShares = revenueShares;
        await transaction.save();

        await this.walletService.linkWalletsToTransaction(transaction);

        return {
          paymentIntentId: result.session.id,
          paymentLink: `https://www.merchant.geidea.net/hpp/checkout/?${result.session.id}`,
          transactionCode: transactionCode
        };
      }

      throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR);
    } catch (error) {
      console.error('Error parsing JSON response from Geidea:', error);
      throw new BaseHttpException(ErrorCodeEnum.PAYMENT_ERROR);
    }
  }

  generateSignatureForSession(
    merchantId: string,
    amountStr: string,
    currency: string,
    orderId: string,
    timestamp: string,
    secretKey: string
  ): string {
    const stringToSign = `${merchantId}${amountStr}${currency}${orderId}${timestamp}`;

    return crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('base64');
  }

  private verifyGeideaWebhookSignature(body: any): boolean {
    console.log('🔍 Verifying Geidea signature...');
    const order = body.order || {};
    const signature = body.signature || body.Signature;

    // if 12500 -> 12500.00
    let amountStr = '';
    if (order.amount !== undefined && order.amount !== null) {
      amountStr = Number(order.amount).toFixed(2);
    }

    const merchantPublicKey = order.merchantPublicKey || '';
    const currency = (order.currency || '').toUpperCase();
    const orderId = order.orderId || '';
    const status = order.status || '';
    const merchantReferenceId = order.merchantReferenceId || '';
    const timeStamp = body.timeStamp || '';

    const concatStr =
      merchantPublicKey +
      amountStr +
      currency +
      orderId +
      status +
      merchantReferenceId +
      timeStamp;

    const secret = (this.geideaConfigs.api_password || '').trim();

    // console.log('-------------------------------------');
    // console.log('merchantPublicKey:', merchantPublicKey);
    // console.log('amount:', amountStr);
    // console.log('currency:', currency);
    // console.log('orderId:', orderId);
    // console.log('status:', status);
    // console.log('merchantReferenceId:', merchantReferenceId);
    // console.log('timeStamp:', timeStamp);
    // console.log('-------------------------------------');

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(concatStr, 'utf8');
    const expectedSignature = hmac.digest('base64');

    // console.log('📝 Concat String:', concatStr);
    // console.log('💚 Received:', signature);
    // console.log('💜 Expected:', expectedSignature);

    const valid = expectedSignature === signature;
    console.log(valid ? '✅ Signature VERIFIED' : '❌ Signature MISMATCH');

    return valid;
  }

  private async getVatValues(): Promise<{
    vatPercentage: number;
    paymentGatewayVatPercentage: number;
  }> {
    const systemConfig = (await this.systemConfigsRepository.findOne({}))
      ?.dataValues;
    return {
      vatPercentage: systemConfig?.vat ?? 14,
      paymentGatewayVatPercentage: systemConfig?.paymentGatewayVat ?? 2
    };
  }
}
