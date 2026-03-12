import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Coupon } from '../models/coupons.model';

export interface IProductInfo {
  enTitle?: any;
  id: string;
  lecturerId: string;
  finalPrice: number;
  finalPriceWithoutCoupon: number;
  code: string;
  commissionPercentage: number;
  type: LearningProgramTypeEnum;
  parentType: LearningProgramTypeEnum;
  parentId: string;
  remoteProductId: string;
}

export interface IPurchasable {
  learningProgramId: string;
  remoteProductId: string;
  productInfo: IProductInfo[];
  quantity: number;
  enTitle: string;
  arTitle: string;
  isFullPurchase: boolean;
}

export interface IOrder {
  id: string;
  purchaseItems: Array<IPurchasable>;
  coupon: Coupon;
}
