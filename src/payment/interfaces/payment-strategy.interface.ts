import { RawBodyRequest } from '@nestjs/common';
import { User } from '@src/user/models/user.model';
import { Transaction } from '../models/transaction.model';
import { ICoupon } from './coupon.interface';
import {
  IPaymentLinkResponse,
  TransactionStatusChangeResponse
} from './payment-responses.interfaces';
import { IOrder } from './product-line.interface';
import { LangEnum } from '@src/user/user.enum';

export interface IPaymentStrategy {
  createCheckout<T extends IOrder>(
    order: T,
    customer: User,
    sessionId: string,
    lang?: LangEnum,
    resetCart?: boolean
  ): Promise<IPaymentLinkResponse>;

  createPaymentIntent?<T extends IOrder>(
    order: T,
    customer: User,
    sessionId: string,
    lang?: LangEnum,
    resetCart?: boolean
  ): Promise<{ paymentIntentId?: string; paymentIntentSecretKey?: string , paymentLink?: string , transactionCode? : string }>;

  confirmPaymentIntent?(paymentIntentId: string): Promise<Boolean>;

  refund<T extends Transaction>(
    transaction: T,
    actionTakenBy: User
  ): Promise<TransactionStatusChangeResponse>;

  cancel<T extends Transaction>(
    transaction: T,
    actionTakenBy: User
  ): Promise<TransactionStatusChangeResponse>;

  createRemoteCoupon(coupon: ICoupon): Promise<ICoupon['remoteCouponId']>;

  updateRemoteCouponStatus(
    coupon: ICoupon,
    activate: boolean
  ): Promise<ICoupon['remoteCouponId']>;

  updateRemoteCoupon(coupon: ICoupon): Promise<ICoupon['remoteCouponId']>;

  updateRemoteCouponApplicability(coupon: ICoupon): void;

  deleteRemoteCoupon(coupon: ICoupon): Promise<void>;

  handlePaymentEvent(req: RawBodyRequest<Request>, sig?: string): Promise<void>;
}
