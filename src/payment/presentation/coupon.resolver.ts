import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import {
  NullablePaginatorInput,
} from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { UserRoleEnum } from '@src/user/user.enum';
import { Transactional } from 'sequelize-transactional-typescript';
import { CouponStatusEnum } from '../enums/coupon.enums';
import {
  CouponFilterArg,
  CouponSortArg,
  CouponTransactionsInput,
  CreateCouponInput,
  UpdateCouponInput
} from '../inputs/coupons.inputs';
import {
  GqlCouponResponse,
  GqlCouponsPaginatedResponse
} from '../interfaces/coupon-responses.interface';
import { Coupon } from '../models/coupons.model';
import { Transaction } from '../models/transaction.model';
import { CouponService } from '../services/coupon.service';
import { TransactionService } from '../services/transaction.service';
import { CouponPermissionsEnum } from '@src/security-group/security-group-permissions';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';
import {
  GqlTransactionsPaginatedResponse
} from '../interfaces/transaction-responses.interface';
@Resolver(() => Coupon)
export class CouponResolver {
  constructor(
    private readonly couponService: CouponService,
    private readonly transactionService: TransactionService
  ) {}

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CouponPermissionsEnum.CREATE_COUPONS)
  @Mutation(() => GqlCouponResponse)
  @Transactional()
  async createCoupon(
    @Args('input') createCouponInput: CreateCouponInput
  ): Promise<Coupon> {
    return await this.couponService.createCoupon(createCouponInput);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CouponPermissionsEnum.UPDATE_COUPONS)
  @Mutation(() => GqlCouponResponse)
  @Transactional()
  async updateCoupon(
    @Args('input') updateCouponInput: UpdateCouponInput
  ): Promise<Coupon> {
    return await this.couponService.updateCoupon(updateCouponInput);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CouponPermissionsEnum.DELETE_COUPONS)
  @Mutation(() => GqlCouponResponse)
  @Transactional()
  async deleteCoupon(@Args('id') id: string): Promise<Coupon> {
    return await this.couponService.deleteCoupon(id);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CouponPermissionsEnum.READ_COUPONS)
  @Query(() => GqlCouponsPaginatedResponse)
  @Transactional()
  async getCoupons(
    @Args() filter: CouponFilterArg,
    @Args() sort: CouponSortArg,
    @Args() paginator: NullablePaginatorInput
  ): Promise<PaginationRes<Coupon>> {
    return await this.couponService.getCoupons(
      filter?.filter,
      sort?.sort,
      paginator?.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CouponPermissionsEnum.READ_COUPONS)
  @Query(() => GqlCouponResponse)
  @Transactional()
  async getCoupon(@Args('id') id: string): Promise<Coupon> {
    return this.couponService.getCoupon(id);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CouponPermissionsEnum.UPDATE_COUPONS)
  @Mutation(() => GqlCouponResponse)
  @Transactional()
  async toggleCouponActivationState(@Args('id') id: string): Promise<Coupon> {
    return await this.couponService.updateCouponStatus(id);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(CouponPermissionsEnum.READ_COUPONS)
  @Query(() => GqlTransactionsPaginatedResponse)
  async couponTransactions(
    @Args('input', { type: () => CouponTransactionsInput })
    input: CouponTransactionsInput
  ): Promise<PaginationRes<Transaction>> {
    return await this.transactionService.getCouponTransactions(
      input.couponId,
      input?.pagination,
      input?.sortType
    );
  }

  @ResolveField(() => CouponStatusEnum)
  status(@Parent() coupon: Coupon): CouponStatusEnum {
    const today = new Date();

    if (coupon.endDate < today) {
      return CouponStatusEnum.EXPIRED;
    }

    if (
      coupon.startDate > today ||
      !coupon.isActive
      // ||
      // !coupon.remoteCouponId
    ) {
      return CouponStatusEnum.INACTIVE;
    }

    return CouponStatusEnum.ACTIVE;
  }
}
