import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import {
  generateGqlResponseType,
  GqlBooleanResponse,
  GqlStringResponse
} from '@src/_common/graphql/graphql-response.type';
import {
  CurrentUser,
  getCurrentUserSessionId
} from '@src/auth/auth-user.decorator';
import { AuthGuard } from '@src/auth/auth.guard';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { User } from '@src/user/models/user.model';
import { Transactional } from 'sequelize-transactional-typescript';
import { CreateCartItemInput } from '../inputs/create-cart-item.input';
import { CartItem } from '../models/cart-item.model';
import { Cart } from '../models/cart.model';
import { CartService } from '../services/cart.service';
import { PurchaseService } from '../services/purchase.service';
import { ApplyCouponType } from '../types/apply-coupon.type';
import { LearningProgram } from '../types/learning-program.type';
import { LangEnum } from '@src/user/user.enum';
import { LearningProgramTypeEnum } from '../enums/cart.enums';
import { GetCartCalcsOutput } from '../interfaces/get-cart-calcs.output';
import { CartItemAlertObjectType } from '../interfaces/cart-item-alert.type';
import { ApplyCouponInput } from '../inputs/buy-now.input';
import { constructNow } from 'date-fns';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { Coupon } from '@src/payment/models/coupons.model';
import { PaymentIntentResponse } from '../types/payment-intent.type';
import { Loader } from '@src/_common/decorators/loader.decorator';
import { DiplomaLecturersLoader } from '@src/diploma/loaders/diploma-lecturers.loader';
import { IDataLoaders } from '@src/_common/dataloader/dataloader.interface';
import { Category } from '@src/course-specs/category/category.model';

// responses
const GqlCartItemResponse = generateGqlResponseType(CartItem);
const GqlCartResponse = generateGqlResponseType(Cart);
const GqlApplyCouponResponse = generateGqlResponseType(ApplyCouponType);
const GqlApplyGetCartCalcsResponse =
  generateGqlResponseType(GetCartCalcsOutput);
export const GqlPaymetIntentResponse = generateGqlResponseType(
  PaymentIntentResponse
);

@Resolver(CartItem)
export class CartResolver {
  constructor(
    private readonly cartService: CartService,
    private readonly purchaseService: PurchaseService,
    @Inject(Repositories.CouponsRepository)
    private readonly couponsRepo: IRepository<Coupon>
  ) {}
  /* ************************************** queries **************************************/

  @Query(() => GqlCartResponse)
  @UseGuards(AuthGuard)
  async getCart(@CurrentUser() currentUser: User): Promise<Cart> {
    return this.cartService.getCart(currentUser);
  }

  @Query(() => GqlApplyCouponResponse)
  async applyCoupon(
    @CurrentUser() currentUser: User,
    @Args('coupon_code', { nullable: true }) code?: string
  ): Promise<ApplyCouponType> {
    return await this.cartService.applyCoupon(currentUser, code);
  }

  @Query(() => GqlApplyCouponResponse)
  async applyCouponOnCartItems(
    @Args('cartItems', { type: () => [CreateCartItemInput] })
    cartItems: CreateCartItemInput[],
    @Args('coupon_code', { nullable: true }) code?: string
  ): Promise<ApplyCouponType> {
    return await this.cartService.applyCouponOnCartItems(cartItems, code);
  }

  @Query(() => GqlApplyGetCartCalcsResponse)
  async getCartCalcs(
    @Args('items', { type: () => [CreateCartItemInput] })
    items: CreateCartItemInput[],
    @Args('coupon_code', { nullable: true }) code?: string
  ): Promise<GetCartCalcsOutput> {
    return await this.cartService.getCartCalcs(items, code);
  }
  /* ************************************** mutations **************************************/
  @Mutation(() => GqlCartItemResponse)
  @UseGuards(AuthGuard)
  async createCartItem(
    @CurrentUser() currentUser: User,
    @Args('input') input: CreateCartItemInput
  ): Promise<CartItem> {
    console.log(currentUser.id);

    return this.cartService.createCartItem(currentUser, input);
  }

  @Mutation(() => GqlCartResponse, {
    description: 'use this mutation when a guest login with multiple cartItems '
  })
  @UseGuards(AuthGuard)
  async createMultipleCartItems(
    @CurrentUser() currentUser: User,
    @Args('input', { type: () => [CreateCartItemInput] })
    input: CreateCartItemInput[]
  ): Promise<Cart> {
    return this.cartService.createMultipleCartItems(currentUser, input);
  }

  @Mutation(() => GqlCartResponse)
  @UseGuards(AuthGuard)
  async deleteCardItem(
    @CurrentUser() currentUser: User,
    @Args('cartItemId') cartItemId: string
  ): Promise<Cart> {
    return this.cartService.deleteCartItem(currentUser, cartItemId);
  }

  @Mutation(() => GqlApplyCouponResponse)
  async cancelCoupon(
    @CurrentUser() currentUser: User
  ): Promise<ApplyCouponType> {
    return await this.cartService.cancelCoupon(currentUser);
  }

  @Transactional()
  @UseGuards(AuthGuard)
  @Mutation(() => GqlStringResponse)
  async createCheckOut(
    @CurrentUser() currentUser: User,
    @getCurrentUserSessionId() sessionId: string,
    @Context('lang') lang?: LangEnum,
    @Args('coupon_code', { nullable: true }) code?: string
  ): Promise<string> {
    return (
      await this.purchaseService.checkout(currentUser, sessionId, code, lang)
    )?.paymentLink;
  }

  @Transactional()
  @UseGuards(AuthGuard)
  @Mutation(() => GqlPaymetIntentResponse)
  async createPaymentIntent(
    @CurrentUser() currentUser: User,
    @getCurrentUserSessionId() sessionId: string,
    @Context('lang') lang?: LangEnum,
    @Args('coupon_code', { nullable: true }) code?: string
  ): Promise<{
    paymentIntentId?: string;
    paymentIntentSecretKey?: string;
    paymentLink?: string;
    transactionCode? : string
  }> {
    const response = await this.purchaseService.createPaymentIntent(
      currentUser,
      sessionId,
      code,
      lang
    );
    return {
      paymentIntentId: response.paymentIntentId,
      paymentIntentSecretKey: response?.paymentIntentSecretKey || null,
      paymentLink: response?.paymentLink || null,
      transactionCode : response?.transactionCode
    };
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlBooleanResponse)
  async confirmPaymentIntent(
    @Args('paymentIntentId') paymentIntentId: string
  ): Promise<Boolean> {
    return this.purchaseService.confirmPaymentIntent(paymentIntentId);
  }

  @Mutation(() => GqlApplyCouponResponse)
  async applyCouponForBuyNow(
    @Args('input') input: ApplyCouponInput
  ): Promise<ApplyCouponType> {
    const uppercaseCode = input?.couponCode?.toUpperCase();
    const coupon = await this.couponsRepo.findOne({ code: uppercaseCode });
    if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
    if (!coupon.isActive)
      throw new BaseHttpException(ErrorCodeEnum.COUPON_IS_NOT_ACTIVE);

    const couponResault = await this.cartService.applyCouponForBuyNow(
      coupon,
      input.programId,
      input.programType
    );
    // console.log('couponResault', couponResault);
    // console.log('------------------------------------');
    return couponResault;
  }

  /* ************************************** resolve fields **************************************/
  @ResolveField(() => LearningProgram)
  async learningProgram(@Parent() cartItem: CartItem): Promise<any> {
    return await this.cartService.getLearningProgram(
      cartItem.learningProgramId,
      cartItem.learningProgramType
    );
  }

  @ResolveField(() => [Course], { nullable: true })
  async programs(@Parent() cartItem: CartItem): Promise<Course[]> {
    if (cartItem.learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
      const programs = await this.cartService.getDiplomaPrograms(
        cartItem.learningProgramId
      );
      return programs;
    } else {
      return null;
    }
  }

  @ResolveField(() => String, { nullable: true })
  async title(
    @Parent() cartItem: CartItem,
    @Context('lang') lang: LangEnum
  ): Promise<string> {
    const learningProgram = await this.cartService.getLearningProgram(
      cartItem.learningProgramId,
      cartItem.learningProgramType
    );
    return learningProgram[`${lang.toLowerCase()}Title`];
  }

  @ResolveField(() => CartItemAlertObjectType, { nullable: true })
  async alert(
    @Parent() cartItem: CartItem,
    @Context('lang') lang: LangEnum
  ): Promise<string> {
    return cartItem[`${lang.toLowerCase()}Alert`];
  }

  @ResolveField(() => String, { nullable: true })
  async priceMessage(
    @Parent() cartItem: CartItem,
    @Context('lang') lang: LangEnum
  ): Promise<string> {
    return cartItem[`${lang.toLowerCase()}PriceMessage`];
  }

  @ResolveField(() => Category, { nullable: true })
  async category(
    @Parent() cartItem: CartItem,
    @Context('lang') lang: LangEnum
  ): Promise<Category> {
    const learningProgram = await this.cartService.getLearningProgram(
      cartItem.learningProgramId,
      cartItem.learningProgramType
    );

    if (learningProgram?.category) {
      return learningProgram.category;
    }

    return null;
  }

  @ResolveField(() => Number, { nullable: true })
  async lessonsCount(
    @Parent() cartItem: CartItem,
    @Context('lang') lang: LangEnum
  ): Promise<number> {
    const learningProgram = await this.cartService.getLearningProgram(
      cartItem.learningProgramId,
      cartItem.learningProgramType
    );

    const lessonsCount = learningProgram?.courseDetail?.lessonsCount;

    if (lessonsCount !== undefined && lessonsCount !== null) {
      return lessonsCount;
    }

    return null;
  }

  @ResolveField(() => LangEnum, { nullable: true })
  async language(
    @Parent() cartItem: CartItem,
    @Context('lang') lang: LangEnum
  ): Promise<LangEnum> {
    const learningProgram = await this.cartService.getLearningProgram(
      cartItem.learningProgramId,
      cartItem.learningProgramType
    );

    if (learningProgram?.language) {
      return learningProgram.language;
    }
    return null;
  }

  @ResolveField(() => [User], { nullable: true })
  async instructors(
    @Parent() cartItem: CartItem,
    @Context('lang') lang: LangEnum,
    @Context('loaders') loaders: IDataLoaders,
    @Loader(DiplomaLecturersLoader) diplomaLecturersLoader
  ): Promise<User[]> {
    const { learningProgramId, learningProgramType } = cartItem;

    const learningProgram = await this.cartService.getLearningProgram(
      learningProgramId,
      learningProgramType
    );

    if (!learningProgram) return [];

    if (
      learningProgramType === LearningProgramTypeEnum.COURSE ||
      learningProgramType === LearningProgramTypeEnum.WORKSHOP
    ) {
      const users = await loaders.usersByCourseIdLoader.load(
        learningProgram.id
      );
      return users || [];
    }

    if (learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
      const lecturers = await diplomaLecturersLoader.load(learningProgram.id);
      return lecturers || [];
    }

    return [];
  }
}
