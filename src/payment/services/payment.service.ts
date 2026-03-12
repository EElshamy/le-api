import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import {
  TransactionRefundedEvent,
  UnassignUserFromLearningProgramEvent
} from '@src/course/interfaces/assign-user.interface';
import { User } from '@src/user/models/user.model';
import {
  REFUND_USER_IF_UNASSIGNED_EVENT,
  TRANSACTION_REFUNDED_EVENT
} from '../constants/events-tokens.constants';
import { PAYMENT_STRATEGY } from '../constants/payment.constants';
import {
  AllowedExplicitTransactionStatusChangesEnum,
  TransactionStatusEnum
} from '../enums/transaction-status.enum';
import {
  IPaymentLinkResponse,
  TransactionStatusChangeResponse
} from '../interfaces/payment-responses.interfaces';
import { IPaymentStrategy } from '../interfaces/payment-strategy.interface';
import { IOrder } from '../interfaces/product-line.interface';
import { Transaction } from '../models/transaction.model';
import { TransactionService } from './transaction.service';
import { Transactional } from 'sequelize-transactional-typescript';
import { LangEnum } from '@src/user/user.enum';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_STRATEGY)
    private readonly paymentStrategy: IPaymentStrategy,
    private readonly transactionService: TransactionService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async createCheckout<T extends IOrder>(
    sessionId: string,
    user: User,
    order: T,
    lang?: LangEnum,
    resetCart?: boolean
  ): Promise<IPaymentLinkResponse> {
    const checkoutSession = await this.paymentStrategy.createCheckout(
      order,
      user,
      sessionId,
      lang,
      resetCart
    );
    return { paymentLink: checkoutSession.paymentLink };
  }

  async createPaymentIntent<T extends IOrder>(
    sessionId: string,
    user: User,
    order: T,
    lang?: LangEnum,
    resetCart?: boolean
  ): Promise<{
    paymentIntentId?: string;
    paymentIntentSecretKey?: string;
    paymentLink?: string;
    transactionCode? : string
  }> {
    return this.paymentStrategy.createPaymentIntent(
      order,
      user,
      sessionId,
      lang,
      resetCart
    );
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    return this.paymentStrategy.confirmPaymentIntent(paymentIntentId);
  }

  async updateTransactionStatus(
    transactionId: string,
    newStatus: AllowedExplicitTransactionStatusChangesEnum,
    actionTakenBy: User
  ): Promise<TransactionStatusChangeResponse> {
    switch (newStatus) {
      case AllowedExplicitTransactionStatusChangesEnum.REFUNDED:
        return await this.refund(transactionId, actionTakenBy);
      case AllowedExplicitTransactionStatusChangesEnum.CANCELED:
        return await this.cancel(transactionId, actionTakenBy);
      default:
        throw new BaseHttpException(
          ErrorCodeEnum.GENERAL_INVALID_TRANSACTION_STATUS
        );
    }
  }

  async refund(
    transactionId: string,
    actionTakenBy: User
  ): Promise<TransactionStatusChangeResponse> {
    const transaction =
      await this.transactionService.getTransactionById(transactionId);

    if (
      transaction.status === TransactionStatusEnum.REFUNDED ||
      transaction.status === TransactionStatusEnum.CANCELED
    ) {
      throw new BaseHttpException(
        ErrorCodeEnum.TRANSACTION_ALREADY_REFUNDED_OR_CANCELLED
      );
    }

    const { status } = await this.paymentStrategy.refund(
      transaction,
      actionTakenBy
    );

    this.eventEmitter.emitAsync(
      TRANSACTION_REFUNDED_EVENT,
      this.getTransactionRefundedEventPayload(transaction)
    );

    return {
      status
    };
  }

  @OnEvent(REFUND_USER_IF_UNASSIGNED_EVENT, { async: true })
  @Transactional()
  async refundUserIfUnassigned(event: UnassignUserFromLearningProgramEvent) {
    const { userId, learningProgramId, learningProgramType } = event;
    //get transaction
    //get lecturer wallet
    // get the wallet weight
  }

  async cancel(
    transactionId: string,
    actionTakenBy: User
  ): Promise<TransactionStatusChangeResponse> {
    const transaction =
      await this.transactionService.getTransactionById(transactionId);

    if (
      transaction.status === TransactionStatusEnum.REFUNDED ||
      transaction.status === TransactionStatusEnum.CANCELED
    ) {
      throw new BaseHttpException(
        ErrorCodeEnum.TRANSACTION_ALREADY_REFUNDED_OR_CANCELLED
      );
    }

    return {
      status: (await this.paymentStrategy.cancel(transaction, actionTakenBy))
        .status
    };
  }

  private getTransactionRefundedEventPayload(
    transaction: Transaction
  ): TransactionRefundedEvent {
    const event = new TransactionRefundedEvent();
    event.transactionId = transaction.id;
    event.userId = transaction.user.id;
    event.learningPrograms = [];
    for (const item of transaction.purchase.purchaseItems) {
      event.learningPrograms.push({
        learningProgramId: item.learningProgramId,
        learningProgramType: item.type
      });
    }
    return event;
  }
}
