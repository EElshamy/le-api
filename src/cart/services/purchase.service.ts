import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import {
  ContentLevelEnum,
  CourseTypeEnum
} from '@src/course/enums/course.enum';
import { Course } from '@src/course/models/course.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { IPaymentLinkResponse } from '@src/payment/interfaces/payment-responses.interfaces';
import {
  IOrder,
  IProductInfo,
  IPurchasable
} from '@src/payment/interfaces/product-line.interface';
import { Coupon } from '@src/payment/models/coupons.model';
import { PaymentService } from '@src/payment/services/payment.service';
import { User } from '@src/user/models/user.model';
import { dir } from 'console';
import { LearningProgramTypeEnum } from '../enums/cart.enums';
import { BuyNowInput } from '../inputs/buy-now.input';
import { CartItem } from '../models/cart-item.model';
import { PurchaseItem } from '../models/purchase-item.model';
import { Purchase } from '../models/purchase.model';
import { CartService } from './cart.service';
import { LangEnum } from '@src/user/user.enum';
import { en } from '@faker-js/faker';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';

//TODO: have a second look ASAP
@Injectable()
export class PurchaseService {
  constructor(
    @Inject(Repositories.PurchasesRepository)
    private readonly purchasesRepo: IRepository<Purchase>,
    @Inject(Repositories.PurchaseItemsRepository)
    private readonly purchaseItemsRepo: IRepository<PurchaseItem>,
    @Inject(Repositories.CartItemsRepository)
    private readonly cartItemsRepo: IRepository<CartItem>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.CouponsRepository)
    private readonly couponsRepo: IRepository<Coupon>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignmentsRepo: IRepository<UsersAssignment>,
    private readonly paymentService: PaymentService,
    private readonly cartService: CartService
  ) {}

  /* **************************************converting cartItem to purchaseItem **************************************/
  async convertCartItemToPurchaseItem(
    cartItem: CartItem,
    currentUser: User,
    discountShare: number = 0
  ): Promise<Partial<PurchaseItem>> {
    console.log('convertCartItemToPurchaseItem', discountShare);

    const learningProgram = await this.cartService.getLearningProgram(
      cartItem.learningProgramId,
      cartItem.learningProgramType
    );

    if (cartItem.learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
      return await this.convertDiplomaCartItemToPurchaseItem(
        cartItem,
        learningProgram,
        discountShare,
        currentUser
      );
    } else {
      return await this.convertCourseCartItemToPurchaseItem(
        cartItem,
        learningProgram,
        discountShare
      );
    }
  }
  async convertDiplomaCartItemToPurchaseItem(
    cartItem: CartItem,
    learningProgram: any,
    discountShare: number = 0,
    currentUser: User
  ) {
    let isFullPurchase: boolean = true;
    const diploma = await this.diplomasRepo.findOne({
      id: cartItem.learningProgramId
    });

    let diplomaCourses = await this.diplomaCoursesRepo.findAll(
      {
        diplomaId: diploma.id,
        keptForOldAssignments: false
      },
      [
        {
          model: Course
        }
      ]
    );

    const totalPriceOfCoursesUnderDiploma = diplomaCourses.reduce(
      (acc, dc) => acc + dc.priceOfCourseUnderDiploma,
      0
    );
    console.log(
      'totalPriceOfCoursesUnderDiploma',
      totalPriceOfCoursesUnderDiploma,
      'adjustedPrice',
      cartItem.adjustedPrice
    );

    const idsOfCoursesWhereUserIsAssigned = (
      await this.userAssignmentsRepo.findAll(
        {
          userId: currentUser.id,
          courseId: diplomaCourses.map(dc => dc.courseId)
        },
        [
          {
            model: Course,
            include: [
              {
                model: CourseLecturer,
                include: [{ model: Lecturer }]
              }
            ]
          }
        ]
      )
    ).map(uac => uac.courseId);

    diplomaCourses = diplomaCourses.filter(dc => {
      if (!idsOfCoursesWhereUserIsAssigned.includes(dc.courseId)) {
        isFullPurchase = false;
        return true;
      }
      return false;
    });

    if (!diplomaCourses.length) {
      throw new BaseHttpException(
        ErrorCodeEnum.ALREADY_ASSIGNED_TO_ALL_COURSES_IN_DIPLOMA
      );
    }
    const productInformations: IProductInfo[] = [];
    const diplomaPrice =
      cartItem.adjustedPrice ??
      diploma.priceAfterDiscount ??
      diploma.originalPrice;

    for (const dc of diplomaCourses) {
      // use commissionOfCourseUnderDiploma when present, otherwise fallback
      const commissionPercentage = dc.commissionOfCourseUnderDiploma ?? null;

      const discountAmount =
        discountShare ?
          (dc.priceOfCourseUnderDiploma /
            (cartItem.adjustedPrice || totalPriceOfCoursesUnderDiploma)) *
          (discountShare * 100)
        : 0;

      // final price after discount
      const finalPrice = Math.floor(
        diplomaPrice === 0 ? 0 : dc.priceOfCourseUnderDiploma - discountAmount
      );

      productInformations.push({
        id: dc.course.id,
        code: dc.course.code,
        lecturerId: null,
        commissionPercentage,
        finalPrice,
        finalPriceWithoutCoupon: dc.priceOfCourseUnderDiploma,
        parentId: dc.diplomaId,
        parentType: LearningProgramTypeEnum.DIPLOMA,
        type:
          dc.course.type === CourseTypeEnum.COURSE ?
            LearningProgramTypeEnum.COURSE
          : LearningProgramTypeEnum.WORKSHOP,
        remoteProductId: dc.course.remoteProductId,
        enTitle: dc.course.enTitle
      });
    }

    // dir(productInformations, { depth: Infinity });

    return {
      learningProgramId: learningProgram.id,
      productInfo: productInformations,
      remoteProductId: learningProgram.remoteProductId,
      quantity: 1,
      level: learningProgram.level,
      priceAfterDiscount: learningProgram.priceAfterDiscount,
      originalPrice: learningProgram.originalPrice,
      arTitle: learningProgram.arTitle,
      enTitle: learningProgram.enTitle,
      code: learningProgram.code,
      thumbnail: learningProgram.thumbnail,
      learningTime: learningProgram.learningTime,
      type: LearningProgramTypeEnum.DIPLOMA,
      isFullPurchase
    };
  }
  async convertCourseCartItemToPurchaseItem(
    cartItem: CartItem,
    learningProgram: any,
    discountShare: number = 0
  ) {
    const commissionPercentage = null;
    // learningProgram?.commissionPercentage ||
    // (learningProgram as Course)?.lecturer?.commissionPercentage;

    return {
      learningProgramId: learningProgram.id,
      productInfo: [
        {
          id: learningProgram.id,
          code: learningProgram.code,
          parentType:
            learningProgram.type === CourseTypeEnum.COURSE ?
              LearningProgramTypeEnum.COURSE
            : LearningProgramTypeEnum.WORKSHOP,
          // lecturerId: (learningProgram as Course).lecturerId,
          lecturerId: null,
          finalPrice: Math.floor(
            (learningProgram.priceAfterDiscount ??
              learningProgram.originalPrice) -
              discountShare * 100
          ),
          finalPriceWithoutCoupon:
            learningProgram.priceAfterDiscount ?? learningProgram.originalPrice,
          commissionPercentage,
          type: cartItem.learningProgramType,
          parentId: learningProgram.id,
          remoteProductId: learningProgram.remoteProductId,
          enTitle: learningProgram.enTitle
        }
      ],
      arTitle: learningProgram.arTitle,
      enTitle: learningProgram.enTitle,
      thumbnail: learningProgram.thumbnail,
      priceAfterDiscount: learningProgram.priceAfterDiscount,
      originalPrice: learningProgram.originalPrice,
      code: learningProgram.code,
      quantity: 1,
      remoteProductId: learningProgram.remoteProductId,
      isFullPurchase: true,
      level: learningProgram.level,
      learningTime: learningProgram.learningTime,
      type:
        learningProgram.type === CourseTypeEnum.COURSE ?
          LearningProgramTypeEnum.COURSE
        : LearningProgramTypeEnum.WORKSHOP
    };
  }
  /* ************************************** getters **************************************/
  async getCoupon(couponId: string): Promise<Coupon> {
    return await this.couponsRepo.findOne({
      id: couponId
    });
  }
  async getPurchase(userId: string): Promise<Purchase[]> {
    return await this.purchasesRepo.findAll({ userId }, [
      {
        model: PurchaseItem
      }
    ]);
  }
  async getPurchaseItems(purchaseId: string): Promise<PurchaseItem[]> {
    const purchaseItems = await this.purchaseItemsRepo.findAll({
      purchaseId
    });
    return purchaseItems;
  }
  async getPurchasables(purchase: Purchase): Promise<IPurchasable[]> {
    return purchase.purchaseItems.map(purchaseItem => {
      return {
        id: purchaseItem.id,
        type: purchaseItem.type,
        productInfo: purchaseItem.productInfo,
        quantity: purchaseItem.quantity,
        remoteProductId: purchaseItem.remoteProductId,
        learningProgramId: purchaseItem.learningProgramId,
        arTitle: purchaseItem.arTitle,
        enTitle: purchaseItem.enTitle,
        isFullPurchase: purchaseItem.isFullPurchase
      };
    });
  }
  /* *****************************************/
  async preparedPurchase(purchaseId: string, coupon: Coupon): Promise<IOrder> {
    const purchase = await this.purchasesRepo.findOne(
      {
        id: purchaseId
      },
      [
        {
          model: PurchaseItem,
          required: true
        },
        { model: Coupon, required: false }
      ]
    );
    const purchasables = await this.getPurchasables(purchase);
    return {
      id: purchase.id,
      purchaseItems: purchasables,
      coupon
    };
  }
  async createPurchaseForUser(
    currentUser: User,
    code?: string
  ): Promise<IOrder> {
    const uppercaseCode = code ? code.toUpperCase() : null;
    const coupon =
      code ? await this.couponsRepo.findOne({ code: uppercaseCode }) : null;

    let cart = await this.cartService.getCart(currentUser);
    if (!cart.checkoutAvailable) {
      throw new BaseHttpException(ErrorCodeEnum.CART_CHECKOUT_NOT_AVAILABLE);
    }

    const cartItems =
      cart?.cartItems ||
      (await this.cartItemsRepo.findAll({
        cartId: cart.id
      }));

    !cart && (cart = await this.cartService.createCart(currentUser));
    if (cart.totalQuantity === 0) {
      throw new BaseHttpException(ErrorCodeEnum.CART_IS_EMPTY);
    }

    const purchase = await this.purchasesRepo.createOne({
      userId: currentUser.id,
      totalQuantity: cart.totalQuantity,
      subTotalPrice: cart.totalPrice,
      totalPrice: cart.totalPrice
    });

    let discountShares;
    if (coupon) {
      const { discountAmount, itemDiscountShare } =
        await this.cartService.applyCoupon(currentUser, uppercaseCode);
      discountShares = itemDiscountShare;
      if (discountAmount && discountAmount > 0) {
        await this.purchasesRepo.updateOneFromExistingModel(purchase, {
          totalPrice: purchase.subTotalPrice - Math.floor(discountAmount * 100)
        });
      }
      await purchase.$set('coupon', coupon);
    }
    console.log(
      'discountShares',
      discountShares,
      'cartItemsIds',
      cartItems.map(cartItem => cartItem.id)
    );

    const purchaseItems = await Promise.all(
      cartItems.map(async cartItem => {
        return await this.convertCartItemToPurchaseItem(
          cartItem,
          currentUser,
          discountShares?.[cartItem.id]
        );
      })
    );
    const createdPurchaseItems =
      await this.purchaseItemsRepo.bulkCreate(purchaseItems);

    // console.log('createdPurchaseItems', createdPurchaseItems);
    // console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
    await purchase.$set('purchaseItems', createdPurchaseItems);
    return this.preparedPurchase(purchase.id, coupon);
  }
  //*****************************************/
  async getPurchaseItem(
    programId: string,
    programType: LearningProgramTypeEnum,
    currentUser: User
  ): Promise<
    IPurchasable & {
      level: ContentLevelEnum;
      originalPrice: number;
      priceAfterDiscount: number;
      code: string;
      thumbnail: string;
      learningTime: number;
      type: LearningProgramTypeEnum;
    }
  > {
    const program = await this.cartService.getLearningProgram(
      programId,
      programType
    );
    if (programType == LearningProgramTypeEnum.DIPLOMA) {
      let isFullPurchase = true;
      let diplomaCourses = await this.diplomaCoursesRepo.findAll(
        {
          diplomaId: programId,
          keptForOldAssignments: false
        },
        [
          {
            model: Course
          }
        ]
      );

      const idsOfCoursesWhereUserIsAssigned = (
        await this.userAssignmentsRepo.findAll(
          {
            userId: currentUser.id,
            courseId: diplomaCourses.map(dc => dc.courseId)
          },
          [
            {
              model: Course,
              include: [{ model: Lecturer, required: true }]
            }
          ]
        )
      ).map(uac => uac.courseId);

      diplomaCourses = diplomaCourses.filter(dc => {
        if (!idsOfCoursesWhereUserIsAssigned.includes(dc.courseId)) {
          isFullPurchase = false;
          return true;
        }
        return false;
      });

      if (!diplomaCourses.length) {
        throw new BaseHttpException(
          ErrorCodeEnum.ALREADY_ASSIGNED_TO_ALL_COURSES_IN_DIPLOMA
        );
      }
      const productInformations: Array<IProductInfo> = diplomaCourses.reduce<
        IProductInfo[]
      >((acc, dc) => {
        const commissionPercentage = null;
        // dc.commissionOfCourseUnderDiploma ||
        // dc.course?.commissionPercentage ||
        // dc.course?.lecturer?.commissionPercentage;

        acc.push({
          id: dc.course.id,
          code: dc.course.code,
          // lecturerId: dc.course.lecturerId,
          lecturerId: null,
          commissionPercentage,
          finalPrice: dc.priceOfCourseUnderDiploma,
          finalPriceWithoutCoupon: dc.priceOfCourseUnderDiploma,
          parentId: dc.diplomaId,
          parentType: LearningProgramTypeEnum.DIPLOMA,
          type: LearningProgramTypeEnum.COURSE,
          remoteProductId: dc.course.remoteProductId
        });
        return acc;
      }, []);

      dir(productInformations, { depth: Infinity });

      return {
        learningProgramId: programId,
        productInfo: productInformations,
        remoteProductId: program.remoteProductId,
        quantity: 1,
        level: program.level,
        priceAfterDiscount: program.priceAfterDiscount,
        originalPrice: program.originalPrice,
        arTitle: program.arTitle,
        enTitle: program.enTitle,
        code: program.code,
        thumbnail: program.thumbnail,
        learningTime: program.learningTime,
        type: LearningProgramTypeEnum.DIPLOMA,
        isFullPurchase
      };
    } else {
      const commissionPercentage = null;
      // program?.commissionPercentage ||
      // (program as Course)?.lecturer?.commissionPercentage;
      return {
        learningProgramId: program.id,
        productInfo: [
          {
            id: program.id,
            code: program.code,
            parentType: LearningProgramTypeEnum.COURSE,
            // lecturerId: (program as Course).lecturerId,
            lecturerId: null,
            finalPrice: program.priceAfterDiscount,
            finalPriceWithoutCoupon: program.priceAfterDiscount,
            commissionPercentage,
            type: programType,
            parentId: program.id,
            remoteProductId: program.remoteProductId
          }
        ],
        quantity: 1,
        remoteProductId: program.remoteProductId,
        arTitle: program.arTitle,
        enTitle: program.enTitle,
        code: program.code,
        isFullPurchase: true,
        learningTime: program.learningTime,
        level: program.level,
        originalPrice: program.originalPrice,
        priceAfterDiscount: program.priceAfterDiscount,
        thumbnail: program.thumbnail,
        type:
          program.type === CourseTypeEnum.COURSE ?
            LearningProgramTypeEnum.COURSE
          : LearningProgramTypeEnum.WORKSHOP
      };
    }
  }

  /* ****************************************************************************/
  // async buyNow(
  //   input: BuyNowInput,
  //   currentUser: User,
  //   sessionId: string,
  //   lang?: LangEnum
  // ): Promise<IPaymentLinkResponse> {
  //   console.log(
  //     `buying now for user : '${currentUser.enFullName}' with id : ${currentUser.id} is running 🏃‍♂️..`
  //   );

  //   const { programId, programType, coupon_code } = input;
  //   const coupon =
  //     coupon_code ?
  //       await this.couponsRepo.findOne({ code: coupon_code })
  //     : null;
  //   const program = await this.cartService.getLearningProgram(
  //     programId,
  //     programType
  //   );
  //   const purchase = await this.purchasesRepo.createOne({
  //     userId: currentUser.id,
  //     totalQuantity: 1,
  //     subTotalPrice: program.priceAfterDiscount || program.originalPrice,
  //     totalPrice: program.priceAfterDiscount || program.originalPrice
  //   });
  //   const purchaseItem = await this.getPurchaseItem(
  //     programId,
  //     programType,
  //     currentUser
  //   );
  //   const createdPurchaseItem = await this.purchaseItemsRepo.createOne({
  //     ...purchaseItem,
  //     purchaseId: purchase.id
  //   });

  //   await purchase.$set('purchaseItems', createdPurchaseItem);

  //   if (coupon) {
  //     //apply the coupon
  //   }
  //   const preparedPurchase = await this.preparedPurchase(purchase.id, coupon);

  //   //romove the program if it is already in the cart
  //   const cart = await this.cartService.getCart(currentUser);
  //   cart.cartItems.forEach(async item => {
  //     if (
  //       item.learningProgramId === input.programId &&
  //       item.learningProgramType === input.programType
  //     ) {
  //       await this.cartService.deleteCartItem(currentUser, item.id);
  //     }
  //   });

  //   dir(preparedPurchase, { depth: Infinity });
  //   return await this.paymentService.createCheckout(
  //     sessionId,
  //     currentUser,
  //     preparedPurchase,
  //     lang,
  //     false
  //   );
  // }

  async buyNow(
    input: BuyNowInput,
    currentUser: User,
    sessionId: string,
    lang?: LangEnum
  ) {
    console.log(
      `buying now for user: '${currentUser.enFullName}' with id: ${currentUser.id} is running 🏃‍♂️..`
    );

    const { programId, programType, coupon_code } = input;

    //validate that the user is not already assigned to the program
    const learningProgram = await this.cartService.getLearningProgram(
      programId,
      programType
    );

    const assigned =
      programType === LearningProgramTypeEnum.DIPLOMA ?
        !!(await this.userAssignmentsRepo.findOne({
          userId: currentUser.id,
          diplomaId: programId
        }))
      : !!(await this.userAssignmentsRepo.findOne({
          userId: currentUser.id,
          courseId: programId
        }));

    if (assigned) {
      throw new BaseHttpException(
        programType === LearningProgramTypeEnum.DIPLOMA ?
          ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_DIPLOMA
        : ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_COURSE
      );
    }

    // Create purchase for the user
    const purchase = await this.createPurchaseForBuyNow(
      currentUser,
      programId,
      programType,
      coupon_code
    );

    // Remove the program if it's already in the cart
    const cart = await this.cartService.getCart(currentUser);
    cart.cartItems.forEach(async item => {
      if (
        item.learningProgramId === programId &&
        item.learningProgramType === programType
      ) {
        await this.cartService.deleteCartItem(currentUser, item.id);
      }
    });

    // console.log('purchase is ready to checkout', !!purchase);
    // console.log('-------------------------------------------------------');
    // console.log('purchase:', purchase);
    // console.log('-------------------------------------------------------');
    // console.log('purchaseItem:', purchase.purchaseItems);
    // console.log('-------------------------------------------------------');
    // console.log('purchaseItem.productInfo :', purchase.purchaseItems[0].productInfo);
    // console.log('-------------------------------------------------------');

    // console.log('💚 buy now purchase : ');
    // console.log(JSON.stringify(purchase, null, 2));
    // console.log('----------------------');

    // Create checkout link
    return await this.paymentService.createPaymentIntent(
      sessionId,
      currentUser,
      purchase,
      lang,
      false
    );
  }

  async createPurchaseForBuyNow(
    currentUser: User,
    learningProgramId: string,
    learningProgramType: LearningProgramTypeEnum,
    code?: string
  ): Promise<IOrder> {
    // Get the learning program
    const program = await this.cartService.getLearningProgram(
      learningProgramId,
      learningProgramType
    );

    // console.log(
    //   'programPrice : ',
    //   program.priceAfterDiscount || program.originalPrice
    // );

    let discountShares;
    let discountAmount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (code) {
      const uppercaseCode = code.toUpperCase();
      coupon = await this.couponsRepo.findOne({ code: uppercaseCode });
      if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
      const couponResults = await this.cartService.applyCouponForBuyNow(
        coupon,
        learningProgramId,
        learningProgramType
      );
      discountShares = couponResults.itemDiscountShare;
      discountAmount = couponResults.discountAmount;
      // console.log('discountAmount : ', discountAmount * 100);
      // console.log('-----------------------------');
      // console.log('discountAmount : ', Math.round(discountAmount));
      // console.log('-----------------------------');
      // console.log('discountAmount : ', Math.round(discountAmount * 100));
      // console.log('-----------------------------');
    }

    // Create purchase
    const purchase = await this.purchasesRepo.createOne({
      userId: currentUser.id,
      totalQuantity: 1,
      subTotalPrice: program.priceAfterDiscount ?? program.originalPrice,
      totalPrice:
        (program.priceAfterDiscount ?? program.originalPrice) -
        Math.round(discountAmount) //discountAmount
    });

    if (coupon) {
      await purchase.$set('coupon', coupon);
    }

    // Create purchase item
    const purchaseItem = await this.convertProgramToPurchaseItemForBuyNow(
      program,
      learningProgramType,
      currentUser,
      discountShares?.[learningProgramId] ?? 0
    );

    const createdPurchaseItem = await this.purchaseItemsRepo.createOne({
      ...purchaseItem,
      purchaseId: purchase.id
    });

    await purchase.$set('purchaseItems', [createdPurchaseItem]);

    return this.preparedPurchase(purchase.id, coupon);
  }

  async convertProgramToPurchaseItemForBuyNow(
    learningProgram: any,
    learningProgramType: LearningProgramTypeEnum,
    currentUser: User,
    discountShare: number = 0
  ): Promise<Partial<PurchaseItem>> {
    if (learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
      return this.convertDiplomaToPurchaseItemForBuyNow(
        learningProgram,
        discountShare,
        currentUser
      );
    } else {
      return this.convertCourseToPurchaseItemForBuyNow(
        learningProgram,
        discountShare
      );
    }
  }

  async convertCourseToPurchaseItemForBuyNow(
    learningProgram: any,
    discountShare: number = 0
  ): Promise<Partial<PurchaseItem>> {
    const commissionPercentage = null;
    // learningProgram?.commissionPercentage ||
    // (learningProgram as Course)?.lecturer?.commissionPercentage;

    return {
      learningProgramId: learningProgram.id,
      productInfo: [
        {
          id: learningProgram.id,
          code: learningProgram.code,
          parentType: LearningProgramTypeEnum.COURSE,
          // lecturerId: (learningProgram as Course).lecturerId,
          lecturerId: null,
          finalPrice: Math.floor(
            (learningProgram.priceAfterDiscount ??
              learningProgram.originalPrice) -
              discountShare * 100
          ),
          finalPriceWithoutCoupon:
            learningProgram.priceAfterDiscount ?? learningProgram.originalPrice,
          commissionPercentage,
          type: LearningProgramTypeEnum.COURSE,
          parentId: learningProgram.id,
          remoteProductId: learningProgram.remoteProductId
        }
      ],
      arTitle: learningProgram.arTitle,
      enTitle: learningProgram.enTitle,
      thumbnail: learningProgram.thumbnail,
      priceAfterDiscount: learningProgram.priceAfterDiscount,
      originalPrice: learningProgram.originalPrice,
      code: learningProgram.code,
      quantity: 1,
      remoteProductId: learningProgram.remoteProductId,
      isFullPurchase: true,
      level: learningProgram.level,
      learningTime: learningProgram.learningTime,
      type: LearningProgramTypeEnum.COURSE
    };
  }

  async convertDiplomaToPurchaseItemForBuyNow(
    learningProgram: any,
    discountShare: number = 0,
    currentUser: User
  ): Promise<Partial<PurchaseItem>> {
    let isFullPurchase = true;
    const diploma = await this.diplomasRepo.findOne({ id: learningProgram.id });

    // Fetch all courses in diploma
    let diplomaCourses = await this.diplomaCoursesRepo.findAll(
      { diplomaId: diploma.id, keptForOldAssignments: false },
      [{ model: Course }]
    );

    const totalPriceOfCourses = diplomaCourses.reduce(
      (acc, dc) => acc + dc.priceOfCourseUnderDiploma,
      0
    );

    // Check what courses user already owns
    const assignedCourses = await this.userAssignmentsRepo.findAll(
      {
        userId: currentUser.id,
        courseId: diplomaCourses.map(dc => dc.courseId)
      },
      [
        {
          model: Course,
          include: [
            {
              model: CourseLecturer,
              include: [{ model: Lecturer }]
            }
          ]
        }
      ]
    );

    const assignedCourseIds = assignedCourses.map(uac => uac.courseId);

    // Keep only unassigned courses
    diplomaCourses = diplomaCourses.filter(dc => {
      if (!assignedCourseIds.includes(dc.courseId)) {
        isFullPurchase = false;
        return true;
      }
      return false;
    });

    if (!diplomaCourses.length) {
      throw new BaseHttpException(
        ErrorCodeEnum.ALREADY_ASSIGNED_TO_ALL_COURSES_IN_DIPLOMA
      );
    }

    // Build product info array
    const productInformations: IProductInfo[] = diplomaCourses.map(dc => {
      // Same logic as in cart version:
      const commissionPercentage = dc.commissionOfCourseUnderDiploma ?? null;

      const courseDiscount =
        discountShare ?
          (dc.priceOfCourseUnderDiploma / totalPriceOfCourses) *
          (discountShare * 100)
        : 0;

      const finalPrice = Math.max(
        0,
        Math.floor(dc.priceOfCourseUnderDiploma - courseDiscount)
      );

      return {
        id: dc.course.id,
        code: dc.course.code,
        lecturerId: null,
        commissionPercentage,
        finalPrice,
        finalPriceWithoutCoupon: dc.priceOfCourseUnderDiploma,
        parentId: dc.diplomaId,
        parentType: LearningProgramTypeEnum.DIPLOMA,
        type:
          dc.course.type === CourseTypeEnum.COURSE ?
            LearningProgramTypeEnum.COURSE
          : LearningProgramTypeEnum.WORKSHOP,
        remoteProductId: dc.course.remoteProductId,
        enTitle: dc.course.enTitle
      };
    });

    return {
      learningProgramId: learningProgram.id,
      productInfo: productInformations,
      remoteProductId: learningProgram.remoteProductId,
      quantity: 1,
      level: learningProgram.level,
      priceAfterDiscount: learningProgram.priceAfterDiscount,
      originalPrice: learningProgram.originalPrice,
      arTitle: learningProgram.arTitle,
      enTitle: learningProgram.enTitle,
      code: learningProgram.code,
      thumbnail: learningProgram.thumbnail,
      learningTime: learningProgram.learningTime,
      type: LearningProgramTypeEnum.DIPLOMA,
      isFullPurchase
    };
  }

  /* ****************************************************************************/
  async checkout(
    currentUser: User,
    sessionId: string,
    code?: string,
    lang?: LangEnum
  ): Promise<IPaymentLinkResponse> {
    console.log('debugging_______checkout, lang______', lang, '______');
    console.log(
      `checking out  with code :' ${code}' for user : '${currentUser.enFullName}' with id : ${currentUser.id} and session: ${sessionId} is running 🏃‍♂️..`
    );
    const purchase = await this.createPurchaseForUser(currentUser, code);
    // console.log(
    //   'purchase',
    //   purchase.purchaseItems.map(pi => pi.productInfo)
    // );
    // console.log('******************************');
    // dir(purchase, { depth: Infinity });

    console.log('purchase is ready to checkout', !!purchase);
    try {
      return await this.paymentService.createCheckout(
        sessionId,
        currentUser,
        purchase,
        lang
      );
    } catch (error) {
      console.log('error', error);
    }
  }

  async createPaymentIntent(
    currentUser: User,
    sessionId: string,
    code?: string,
    lang?: LangEnum
  ): Promise<{
    paymentIntentId?: string;
    paymentIntentSecretKey?: string;
    paymentLink?: string;
    transactionCode? : string
  }> {
    const purchase = await this.createPurchaseForUser(currentUser, code);
    // console.log('💙 cart purchase : ');
    // console.log(JSON.stringify(purchase, null, 2));
    // console.log('----------------------');
    return await this.paymentService.createPaymentIntent(
      sessionId,
      currentUser,
      purchase,
      lang
    );
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    return this.paymentService.confirmPaymentIntent(paymentIntentId);
  }
}
