import { Field, Int, ObjectType, PartialType } from '@nestjs/graphql';
import { MoneyScalar } from '@src/_common/graphql/money.scaler';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { Purchase } from '@src/cart/models/purchase.model';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import { Category } from '@src/course-specs/category/category.model';
import { LangEnum } from '@src/user/user.enum';

@ObjectType()
export class TransactionPreview {
  @Field()
  id: string;

  @Field()
  code: string;

  @Field(() => TransactionStatusEnum)
  status: TransactionStatusEnum;
}

@ObjectType()
export class TransactionPurchaseItemForAdmin extends PartialType(PurchaseItem) {
  @Field(() => [TransactionLecturerRevenueForAdmin], { nullable: true })
  lecturersShares: TransactionLecturerRevenueForAdmin[];

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field(() => Number, { nullable: true })
  lessonsCount?: number;

  @Field(() => LangEnum, { nullable: true })
  language?: LangEnum;
}

@ObjectType()
export class TransactionPurchaseForAdmin extends PartialType(Purchase) {
  @Field(() => [TransactionPurchaseItemForAdmin], { nullable: true })
  transactionPurchaseItems: TransactionPurchaseItemForAdmin[];

  @Field(() => MoneyScalar)
  totalSystemShare: number;

  @Field(() => MoneyScalar)
  totalVatAmount: number;

  @Field(() => MoneyScalar)
  paymentGateWayVatAmount: number;
}

@ObjectType()
export class TransactionLecturerRevenueForAdmin {
  @Field(() => MoneyScalar)
  totalLecturerShare: number;

  @Field(() => MoneyScalar)
  totalSystemShare: number;

  @Field()
  lecturerEnName: string;

  @Field()
  lecturerArName: string;

  @Field()
  lecturerId: string;
}

@ObjectType()
export class TransactionRevenueForAdmin {
  @Field(() => MoneyScalar)
  totalSystemShare: number;

  @Field(() => [TransactionLecturerRevenueForAdmin], { nullable: true })
  lecturersShares: TransactionLecturerRevenueForAdmin[];

  @Field(() => MoneyScalar)
  totalAmount: number;

  @Field(() => MoneyScalar, { nullable: true })
  subTotal: number;

  @Field(() => MoneyScalar, { nullable: true })
  totalVat: number;

  @Field(() => MoneyScalar, { nullable: true })
  paymentGateWayVatAmount: number;
}
@ObjectType()
export class CourseUnderDiplomaMetadata {
  @Field({ nullable: true })
  diplomaId: string;
  @Field({ nullable: true })
  arMetadata: string;
  @Field({ nullable: true })
  enMetadata: string;
}
@ObjectType()
export class TransactionLecturerRevenue {
  @Field(() => MoneyScalar, { nullable: true })
  lecturerShare: number;

  @Field(() => Int, { nullable: true })
  lecturerCommission: number;

  @Field(() => CourseUnderDiplomaMetadata, { nullable: true })
  courseUnderDiplomaMetadata: CourseUnderDiplomaMetadata;
}

@ObjectType()
export class TransactionRevenueForLecturer {
  @Field(() => MoneyScalar, { nullable: true })
  totalRevenue: number;
}

@ObjectType()
export class TransactionPurchaseItemForLecturer extends PartialType(
  PurchaseItem
) {
  @Field(() => TransactionLecturerRevenue, { nullable: true })
  lecturerShareOfPurchaseItem: TransactionLecturerRevenue;
}

@ObjectType()
export class TransactionPurchaseForLecturer extends PartialType(Purchase) {
  @Field(() => [TransactionPurchaseItemForLecturer], { nullable: true })
  transactionPurchaseItemsForLecturer: TransactionPurchaseItemForLecturer[];
}
