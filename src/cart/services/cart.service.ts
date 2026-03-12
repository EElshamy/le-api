import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { CourseStatusEnum } from '@src/course/enums/course.enum';
import { AssignUserToLearningProgramEvent } from '@src/course/interfaces/assign-user.interface';
import { Course } from '@src/course/models/course.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { DiplomaStatusEnum } from '@src/diploma/enums/diploma-status.enum';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { TRANSACTION_FULFILLED_EVENT } from '@src/payment/constants/events-tokens.constants';
import {
  CouponApplicabilityScopeEnum,
  CouponDiscountTypeEnum
} from '@src/payment/enums/coupon.enums';
import { Coupon } from '@src/payment/models/coupons.model';
import { User } from '@src/user/models/user.model';
import { Sequelize, Transaction } from 'sequelize';
import {
  SEQUELIZE_INSTANCE_NEST_DI_TOKEN,
  Transactional
} from 'sequelize-transactional-typescript';
import { LearningProgramTypeEnum } from '../enums/cart.enums';
import { CreateCartItemInput } from '../inputs/create-cart-item.input';
import { CartItem } from '../models/cart-item.model';
import { Cart } from '../models/cart.model';
import { ApplyCouponType } from '../types/apply-coupon.type';
import { SystemConfig } from '@src/system-configuration/models/system-config.model';
import { GetCartCalcsOutput } from '../interfaces/get-cart-calcs.output';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { Category } from '@src/course-specs/category/category.model';

@Injectable()
export class CartService {
  constructor(
    // repositories
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    @Inject(Repositories.CartsRepository)
    private readonly cartsRepo: IRepository<Cart>,
    @Inject(Repositories.CartItemsRepository)
    private readonly cartItemRepo: IRepository<CartItem>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomasRepo: IRepository<Diploma>,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly usersAssignedCoursesRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.SystemConfigRepository)
    private readonly systemConfigRepo: IRepository<SystemConfig>,
    @Inject(Repositories.UsersRepository)
    private readonly usersRepo: IRepository<User>,
    @Inject(Repositories.CouponsRepository)
    private readonly couponsRepo: IRepository<Coupon>,
    //queues
    @InjectQueue('pusher') private readonly pusherQueue: Queue
  ) {}
  // this method should be invoked when user register and verify his email successfully
  async createCart(currentUser: User): Promise<Cart> {
    const cart = await this.cartsRepo.findOne({ userId: currentUser.id });
    if (cart) {
      return cart;
    }
    return await this.cartsRepo.createOne({
      userId: currentUser.id
    });
  }
  async getCart(currentUser: User): Promise<Cart> {
    const cart = await this.cartsRepo.findOne({ userId: currentUser.id }, [
      { model: CartItem, as: 'cartItems' }
    ]);
    if (!cart) {
      throw new BaseHttpException(ErrorCodeEnum.CART_NOT_FOUND);
    }

    /**
     * example : the user add the diploma to the cart, then he used buy now to buy
     * course from this diploma then we shoud update the cart with alerts and prices
     */
    await this.updateCartWithAlertsAndPrices(cart, currentUser);

    let discountAmount = 0;
    if (cart.lastAppliedCoupon) {
      const coupon = await this.couponsRepo.findOne({
        code: cart?.lastAppliedCoupon.toUpperCase()
      });
      if (coupon) {
        try {
          const result = await this.applyCoupon(
            currentUser,
            cart.lastAppliedCoupon
          );
          discountAmount = result.discountAmount;
        } catch (err) {
          console.warn(
            'Invalid coupon detected, removing from cart:',
            cart.lastAppliedCoupon,
            err?.message
          );
          await this.cancelCoupon(currentUser);
          discountAmount = 0;
        }
      } else {
        await this.cancelCoupon(currentUser);
      }
    }
    cart.discountAmount = discountAmount;

    const vatPercentage =
      ((await this.systemConfigRepo.findOne({}))?.vat ?? 14) / 100;

    if (Math.floor(discountAmount) === Math.floor(cart.totalPrice / 100)) {
      cart.vat = Math.floor(vatPercentage * 100);
      cart.totalPriceAfterDiscount =
        cart.totalPrice / 100 - discountAmount || 0;
      cart.netPrice = cart.totalPriceAfterDiscount / 100 - cart.vatAmount || 0;
      cart.vatAmount = 0;
    } else {
      cart.vat = Math.floor(vatPercentage * 100);
      cart.totalPriceAfterDiscount =
        cart.totalPrice / 100 - discountAmount || 0;
      cart.vatAmount =
        (cart.totalPriceAfterDiscount * vatPercentage) / (1 + vatPercentage) ||
        0;
      cart.netPrice = cart.totalPriceAfterDiscount - cart.vatAmount || 0;
    }

    return cart;
  }

  private async updateCartWithAlertsAndPrices(
    cart: Cart,
    user: User
  ): Promise<void> {
    let totalPrice = 0;
    let checkoutAvailable = true;

    for (const cartItem of cart.cartItems) {
      const learningProgramId = cartItem.learningProgramId;
      const learningProgramType = cartItem.learningProgramType;

      const learningProgram = await this.getLearningProgram(
        learningProgramId,
        learningProgramType
      );

      let arAlert = null;
      let enAlert = null;
      let adjustedPrice = null;
      let arPriceMessage = null;
      let enPriceMessage = null;

      for (const otherItem of cart.cartItems) {
        if (cartItem.id === otherItem.id) continue;

        const otherType = otherItem.learningProgramType;
        const otherId = otherItem.learningProgramId;

        if (
          learningProgramType === LearningProgramTypeEnum.COURSE &&
          otherType === LearningProgramTypeEnum.DIPLOMA
        ) {
          const diplomaCoursesIds = (
            await this.diplomaCoursesRepo.findAll(
              {
                diplomaId: otherId,
                keptForOldAssignments: false
              },
              [{ model: Course, as: 'course' }]
            )
          ).map(dc => dc?.course?.id);

          if (diplomaCoursesIds.includes(learningProgramId)) {
            arAlert = {
              text: 'الدورة موجودة بالفعل ضمن مسار تمت إضافته لسلة التسوق ، لا يمكن الشراء مرتين',
              color: 'red'
            };
            enAlert = {
              text: 'This course is part of the path in your cart and can not be purchased again.',
              color: 'red'
            };
            checkoutAvailable = false;
          }
        } else if (
          learningProgramType === LearningProgramTypeEnum.DIPLOMA &&
          otherType === LearningProgramTypeEnum.COURSE
        ) {
          const diplomaCoursesIds = (
            await this.diplomaCoursesRepo.findAll(
              {
                diplomaId: learningProgramId,
                keptForOldAssignments: false
              },
              [{ model: Course, as: 'course' }]
            )
          ).map(dc => dc?.course?.id);

          if (diplomaCoursesIds.includes(otherId)) {
            arAlert = {
              text: 'الدورة موجودة بالفعل ضمن مسار تمت إضافته لسلة التسوق ، لا يمكن الشراء مرتين',
              color: 'red'
            };
            enAlert = {
              text: 'This course is part of the path in your cart and can not be purchased again.',
              color: 'red'
            };
            checkoutAvailable = false;
          }
        }

        // Handle diploma-diploma overlapping
        if (
          learningProgramType === LearningProgramTypeEnum.DIPLOMA &&
          otherType === LearningProgramTypeEnum.DIPLOMA
        ) {
          const itemsA = (
            await this.diplomaCoursesRepo.findAll({
              diplomaId: learningProgramId,
              keptForOldAssignments: false
            })
          ).map(d => d.courseId);

          const itemsB = (
            await this.diplomaCoursesRepo.findAll({
              diplomaId: otherId,
              keptForOldAssignments: false
            })
          ).map(d => d.courseId);

          const hasOverlap = this.checkOverLapping(itemsA, itemsB);

          if (hasOverlap) {
            arAlert = {
              text: '"هذه المسارات تحتوي على برامج تعليمية متداخلة. يرجى مراجعة التفاصيل لتجنب شراء دورات مكررة."',
              color: 'yellow'
            };
            enAlert = {
              text: 'These paths have overlapping learning programs. Review the details to avoid purchasing duplicate courses',
              color: 'yellow'
            };
          }
        }
      }

      if (learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
        adjustedPrice = await this.getDiplomaAdjustedPrice(
          learningProgramId,
          learningProgram.priceAfterDiscount ?? learningProgram.originalPrice,
          user
        );
        if (adjustedPrice !== null) {
          arPriceMessage =
            'سيتم احتساب السعر المخفض بما أنك تمتلك دورات بداخلها';
          enPriceMessage =
            'The price will be calculated based on the discount for this path as you have courses inside it';
        }
      }

      await this.cartItemRepo.updateOneFromExistingModel(cartItem, {
        arAlert,
        enAlert,
        adjustedPrice,
        arPriceMessage,
        enPriceMessage
      });

      const price =
        adjustedPrice !== null ? adjustedPrice : (
          (learningProgram.priceAfterDiscount ?? learningProgram.originalPrice)
        );

      totalPrice += price;
    }

    await this.cartsRepo.updateOneFromExistingModel(cart, {
      totalPrice,
      totalQuantity: cart.cartItems.length,
      checkoutAvailable
    });
  }

  // *************************** cart items ***************************
  async createCartItem(
    user: User,
    input: CreateCartItemInput,
    merge: boolean = false
  ): Promise<CartItem> {
    const { learningProgramId, learningProgramType } = input;

    //get learning program
    const learningProgram = await this.getLearningProgram(
      learningProgramId,
      learningProgramType
    );

    const assigned =
      learningProgramType === LearningProgramTypeEnum.DIPLOMA ?
        !!(await this.usersAssignedCoursesRepo.findOne({
          userId: user.id,
          diplomaId: learningProgramId
        }))
      : !!(await this.usersAssignedCoursesRepo.findOne({
          userId: user.id,
          courseId: learningProgramId
        }));

    if (assigned) {
      throw new BaseHttpException(
        learningProgramType === LearningProgramTypeEnum.DIPLOMA ?
          ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_DIPLOMA
        : ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_COURSE
      );
    }

    // Added check to prevent adding diploma if user already assigned to all courses
    if (learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
      const diplomaCourses = await this.diplomaCoursesRepo.findAll(
        { diplomaId: learningProgramId, keptForOldAssignments: false },
        [{ model: Course }]
      );

      const assignedCourses = await this.usersAssignedCoursesRepo.findAll({
        userId: user.id,
        courseId: diplomaCourses.map(dc => dc.courseId)
      });

      const assignedCourseIds = assignedCourses.map(a => a.courseId);
      const unassignedCourses = diplomaCourses.filter(
        dc => !assignedCourseIds.includes(dc.courseId)
      );

      if (unassignedCourses.length === 0) {
        // user already assigned to all courses in diploma
        throw new BaseHttpException(
          ErrorCodeEnum.ALREADY_ASSIGNED_TO_ALL_COURSES_IN_DIPLOMA
        );
      }
    }

    let cart = await this.cartsRepo.findOne(
      {
        userId: user.id
      },
      [{ model: CartItem, as: 'cartItems' }]
    );

    if (!cart) {
      cart = await this.createCart(user);
    }

    let addAlert = false; //in case of the cartItem is a course and the user has a diploma in the cart and vice versa
    let overlapping = false;
    let overlappingCartItem: CartItem; // it would be used to check if we will add alert to the created cartItem or not
    const cartItems = cart?.cartItems || [];
    if (cartItems.length > 0) {
      for (const cartItem of cartItems) {
        if (
          cartItem.learningProgramType === LearningProgramTypeEnum.DIPLOMA &&
          (learningProgramType === LearningProgramTypeEnum.COURSE ||
            learningProgramType === LearningProgramTypeEnum.WORKSHOP)
          // here we check if a new cartItem is a course and the user has a diploma in the cart
        ) {
          const diplomaCoursesIds = (
            await this.diplomaCoursesRepo.findAll(
              {
                diplomaId: cartItem?.learningProgramId,
                keptForOldAssignments: false
              },
              [{ model: Course, as: 'course' }]
            )
          ).map(dc => dc?.course?.id);

          if (diplomaCoursesIds?.includes(input?.learningProgramId)) {
            // if true it means there is for example diploma A with x,y,z courses and we want to add course x
            addAlert = true;
            await this.cartsRepo.updateOneFromExistingModel(cart, {
              checkoutAvailable: false
            });
          }
        } else if (
          (cartItem.learningProgramType === LearningProgramTypeEnum.COURSE ||
            cartItem.learningProgramType ===
              LearningProgramTypeEnum.WORKSHOP) &&
          learningProgramType === LearningProgramTypeEnum.DIPLOMA
          // here we check if a new cartItem is a diploma and the user has a course in the cart
        ) {
          const diplomaCoursesIds = (
            await this.diplomaCoursesRepo.findAll(
              {
                diplomaId: input?.learningProgramId,
                keptForOldAssignments: false
              },
              [{ model: Course, as: 'course' }]
            )
          ).map(dc => dc?.course?.id);
          if (diplomaCoursesIds.includes(cartItem?.learningProgramId)) {
            // if true it means we want to add for example diploma A with x,y,z courses and course x is already in the cart
            await this.cartItemRepo.updateOneFromExistingModel(cartItem, {
              arAlert: {
                text: 'الدورة موجودة بالفعل ضمن مسار تمت إضافته لسلة التسوق ، لا يمكن الشراء مرتين',
                color: 'red'
              },
              enAlert: {
                text: 'This course is part of the path in your cart and can not be purchased again.',
                color: 'red'
              }
            });
            await this.cartsRepo.updateOneFromExistingModel(cart, {
              checkoutAvailable: false
            });
          }
        } else if (
          cartItem.learningProgramType === LearningProgramTypeEnum.DIPLOMA &&
          learningProgramType === LearningProgramTypeEnum.DIPLOMA
        ) {
          const existedDiplomaProgramsIds = (
            await this.diplomaCoursesRepo.findAll(
              {
                diplomaId: cartItem?.learningProgramId,
                keptForOldAssignments: false
              },
              [
                {
                  model: Course
                }
              ]
            )
          ).map(edp => edp.courseId);
          const commingDiplomaProgramsIds = (
            await this.diplomaCoursesRepo.findAll(
              {
                diplomaId: learningProgramId,
                keptForOldAssignments: false
              },
              [
                {
                  model: Course
                }
              ]
            )
          ).map(edp => edp.courseId);
          overlapping = this.checkOverLapping(
            existedDiplomaProgramsIds,
            commingDiplomaProgramsIds
          );
          overlappingCartItem = cartItem;
        }
      }
    }

    const existedCartItem = await this.cartItemRepo.findOne({
      cartId: user.cartId,
      learningProgramId: learningProgramId
    });

    if (!!existedCartItem && merge) {
      return existedCartItem;
    } else if (existedCartItem) {
      throw new BaseHttpException(ErrorCodeEnum.CART_ITEM_ALREADY_EXISTS);
    }

    await this.validateIfUserIsAlreadyAssignedToLearningProgram(user.id, input);

    const cartItem = await this.sequelize.transaction(async transaction => {
      let adjustedPrice: number = null,
        addPriceMessage: boolean = false;
      if (learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
        adjustedPrice = await this.getDiplomaAdjustedPrice(
          input.learningProgramId,
          learningProgram.priceAfterDiscount ?? learningProgram.originalPrice,
          user,
          transaction
        );
        console.log('adjustedPrice', adjustedPrice);
        if (adjustedPrice !== null) {
          addPriceMessage = true;
        }
      }

      const item = await this.cartItemRepo.createOne(
        {
          cartId: cart.id,
          learningProgramId: input.learningProgramId,
          learningProgramType: input.learningProgramType,
          ...(addAlert && {
            arAlert: {
              text: 'الدورة موجودة بالفعل ضمن مسار تمت إضافته لسلة التسوق ، لا يمكن الشراء مرتين',
              color: 'red'
            },
            enAlert: {
              text: 'This course is part of the path in your cart and can not be purchased again.',
              color: 'red'
            }
          }),
          ...(overlapping && {
            arAlert: {
              text: '"هذه المسارات تحتوي على برامج تعليمية متداخلة. يرجى مراجعة التفاصيل لتجنب شراء دورات مكررة."',
              color: 'yellow'
            },
            enAlert: {
              text: 'These paths have overlapping learning programs. Review the details to avoid purchasing duplicate courses',
              color: 'yellow'
            }
          }),
          ...(adjustedPrice !== null && {
            adjustedPrice
          }),
          ...(addPriceMessage && {
            arPriceMessage:
              'سيتم احتساب السعر المخفض بما أنك تمتلك دورات بداخلها',
            enPriceMessage:
              'The price will be calculated based on the discount for this path as you have courses inside it'
          })
        },
        transaction
      );

      if (overlapping) {
        await this.cartItemRepo.updateOneFromExistingModel(
          overlappingCartItem,
          {
            arAlert: {
              text: '"هذه المسارات تحتوي على برامج تعليمية متداخلة. يرجى مراجعة التفاصيل لتجنب شراء دورات مكررة."',
              color: 'yellow'
            },
            enAlert: {
              text: 'These paths have overlapping learning programs. Review the details to avoid purchasing duplicate courses',
              color: 'yellow'
            }
          }
        );
      }
      const finalPrice =
        item.adjustedPrice !== null ? item.adjustedPrice
        : (
          learningProgram.priceAfterDiscount >= 0 &&
          learningProgram.priceAfterDiscount !== null
        ) ?
          learningProgram.priceAfterDiscount
        : learningProgram.originalPrice;

      console.log('finalPrice', finalPrice);

      await this.cartsRepo.updateOneFromExistingModel(
        cart,
        {
          totalPrice: cart.totalPrice + finalPrice,
          totalQuantity: cart.totalQuantity + 1
        },
        transaction
      );
      return item;
    });

    return cartItem;
  }
  async createMultipleCartItems(
    user: User,
    cartItems: CreateCartItemInput[]
  ): Promise<Cart> {
    const cart = await this.getCart(user);

    if (!cart) {
      throw new BaseHttpException(ErrorCodeEnum.CART_NOT_FOUND);
    }
    let counter = 0;
    for (const cartItem of cartItems) {
      console.log('creating cart item #', ++counter);
      await this.createCartItem(user, cartItem, true);
    }
    return await this.getCart(user);
  }
  async deleteCartItem(user: User, cartItemId: string): Promise<Cart> {
    console.log('Deleting cart item:', cartItemId);

    // 1️) Get cart item first
    const cartItemToDelete = await this.cartItemRepo.findOne({
      id: cartItemId
    });

    if (!cartItemToDelete) {
      console.log('Cart item already deleted, skipping...');
      return await this.getCart(user);
    }

    // 2️) Get cart safely
    const cart = await this.cartsRepo.findOne({ id: cartItemToDelete.cartId }, [
      { model: CartItem, as: 'cartItems' }
    ]);

    if (!cart) {
      throw new BaseHttpException(ErrorCodeEnum.CART_NOT_FOUND);
    }

    const wasOverLappedDiplomas: CartItem[] = [];
    const cartItems = cart.cartItems || [];

    // 3️) Handle diploma/course overlap logic
    for (const cartItem of cartItems) {
      // CASE 1: deleting diploma -> check its courses alerts
      if (
        (cartItem.learningProgramType === LearningProgramTypeEnum.COURSE ||
          cartItem.learningProgramType === LearningProgramTypeEnum.WORKSHOP) &&
        cartItemToDelete.learningProgramType === LearningProgramTypeEnum.DIPLOMA
      ) {
        const diplomaCoursesIds = (
          await this.diplomaCoursesRepo.findAll(
            {
              diplomaId: cartItemToDelete.learningProgramId,
              keptForOldAssignments: false
            },
            [{ model: Course, as: 'course' }]
          )
        ).map(dc => dc?.course?.id);

        if (diplomaCoursesIds?.includes(cartItem.learningProgramId)) {
          const count = await this.countOfDiplomasContainingCourse(
            cartItems.filter(
              item =>
                item.learningProgramType === LearningProgramTypeEnum.DIPLOMA
            ),
            cartItem.learningProgramId
          );

          if (count === 1) {
            await this.cartItemRepo.updateOneFromExistingModel(cartItem, {
              arAlert: null,
              enAlert: null
            });
          }
        }
      }

      // CASE 2: overlapping diplomas
      else if (
        cartItem.learningProgramType === LearningProgramTypeEnum.DIPLOMA &&
        cartItemToDelete.learningProgramType ===
          LearningProgramTypeEnum.DIPLOMA &&
        (cartItemToDelete.arAlert || cartItemToDelete.enAlert)
      ) {
        wasOverLappedDiplomas.push(cartItem);
      }
    }

    // 4️) Get learning program price
    const learningProgram = await this.getLearningProgram(
      cartItemToDelete.learningProgramId,
      cartItemToDelete.learningProgramType
    );

    const learningProgramPrice =
      cartItemToDelete.adjustedPrice ??
      learningProgram.priceAfterDiscount ??
      learningProgram.originalPrice ??
      0;

    // 5️) Transaction (idempotent, no error on double delete)
    await this.sequelize.transaction(async transaction => {
      await this.cartsRepo.updateOneFromExistingModel(
        cart,
        {
          totalPrice: Math.max(
            (cart.totalPrice ?? 0) - learningProgramPrice,
            0
          ),
          totalQuantity: Math.max((cart.totalQuantity ?? 0) - 1, 0),
          lastAppliedCoupon: null
        },
        transaction
      );

      await this.cartItemRepo.deleteAll({ id: cartItemId }, transaction);
    });

    // 6️) If cart empty → reset
    const remainingItems = await this.cartItemRepo.findAll(
      { cartId: cart.id },
      [],
      undefined,
      ['id']
    );

    if (!remainingItems?.length) {
      await this.resetCart({ userId: user.id, learningPrograms: [] });
    }

    // 7️) Re-check overlapped diplomas AFTER deletion
    if (wasOverLappedDiplomas.length > 0) {
      const updatedCart = await this.getCart(user);

      for (const diploma of wasOverLappedDiplomas) {
        const stillOverlapped = this.checkIfDiplomaStillOverlapped(
          diploma,
          updatedCart.cartItems
        );

        if (stillOverlapped) {
          await this.cartItemRepo.updateOneFromExistingModel(diploma, {
            arAlert: null,
            enAlert: null
          });
        }
      }
    }

    // 8️) Recalculate checkout availability
    const updatedCart = await this.getCart(user);
    const checkoutAvailable = await this.checkIfCheckoutAvailable(updatedCart);

    await this.cartsRepo.updateOneFromExistingModel(updatedCart, {
      checkoutAvailable
    });

    return updatedCart;
  }
  //************************* checkers , validators, getters ,  counters , other methods ************************* */
  checkOverLapping(a: string[], b: string[]): boolean {
    return a.some(item => b.includes(item));
  }
  async checkIfDiplomaStillOverlapped(
    diploma: CartItem,
    cartItems: CartItem[]
  ): Promise<boolean> {
    const diplomaCoursesIds = (
      await this.diplomaCoursesRepo.findAll({
        diplomaId: diploma.learningProgramId,
        keptForOldAssignments: false
      })
    ).map(dc => dc.courseId);
    for (const cartItem of cartItems) {
      if (cartItem.learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
        const cartDiplomaCoursesIds = (
          await this.diplomaCoursesRepo.findAll({
            diplomaId: cartItem.learningProgramId,
            keptForOldAssignments: false
          })
        ).map(dc => dc.courseId);
        return this.checkOverLapping(diplomaCoursesIds, cartDiplomaCoursesIds);
      }
    }
  }
  async checkIfCheckoutAvailable(cart: Cart): Promise<boolean> {
    const cartItems = cart?.cartItems || [];
    for (const cartItem of cartItems) {
      if (
        // here we can also check on color..
        cartItem.arAlert?.text?.split(' ').includes('الكورس') ||
        cartItem.enAlert?.text?.split(' ').includes('Course')
      ) {
        return false;
      }
    }
    return true;
  }
  async validateIfUserIsAlreadyAssignedToLearningProgram(
    userId: string,
    input: CreateCartItemInput
  ): Promise<void> {
    const { learningProgramId, learningProgramType } = input;
    let fieldName: string, erroCode: ErrorCodeEnum;

    if (learningProgramType === LearningProgramTypeEnum.COURSE) {
      fieldName = 'courseId';
      erroCode = ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_COURSE;
    } else {
      fieldName = 'diplomaId';
      erroCode = ErrorCodeEnum.USER_ALREADY_ASSIGNED_TO_DIPLOMA;
    }

    const userIsAlreadyAssigned = await this.usersAssignedCoursesRepo.findOne({
      userId,
      [fieldName]: learningProgramId
    });

    if (userIsAlreadyAssigned) {
      throw new BaseHttpException(erroCode);
    }
  }
  async isAddedToCart(
    userId: string,
    learningProgramId: string
  ): Promise<boolean> {
    if (!userId) {
      return false;
    }

    const cartItem = await this.cartItemRepo.findOne(
      {
        learningProgramId
      },
      [{ model: Cart, as: 'cart', where: { userId } }]
    );

    if (cartItem) {
      return true;
    }

    return false;
  }
  async getCartCalcs(
    cartItems: CreateCartItemInput[],
    coupon_code?: string
  ): Promise<GetCartCalcsOutput> {
    if (cartItems && cartItems?.length < 0) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }
    let totalPrice = 0;
    for (const item of cartItems) {
      const program = await this.getLearningProgram(
        item.learningProgramId,
        item.learningProgramType
      );
      const { priceAfterDiscount, originalPrice } = program as unknown as
        | Course
        | Diploma;

      totalPrice +=
        priceAfterDiscount >= 0 && priceAfterDiscount !== null ?
          priceAfterDiscount
        : originalPrice;
    }
    let discountAmount = 0;
    if (coupon_code) {
      discountAmount = (
        await this.applyCouponOnCartItems(cartItems, coupon_code)
      )?.discountAmount;
    }
    const priceAfterDiscount = totalPrice / 100 - discountAmount;
    const vatPercentage =
      ((await this.systemConfigRepo.findOne({}))?.vat ?? 14) / 100;
    const vat = Math.floor(vatPercentage * 100);
    const vatAmount =
      (priceAfterDiscount * vatPercentage) / (1 + vatPercentage) || 0;

    const netPrice = priceAfterDiscount - vatAmount || 0;
    return {
      totalPrice,
      discountAmount,
      priceAfterDiscount,
      vat,
      vatAmount,
      netPrice
    };
  }
  async getLearningProgram(
    id: string,
    type: LearningProgramTypeEnum
  ): Promise<any> {
    // console.log('getting learning program', id, type);

    if (type === LearningProgramTypeEnum.DIPLOMA) {
      const diploma = await this.diplomasRepo.findOne(
        {
          id
        },
        [
          {
            model: DiplomaDetail
          },
          {
            model: Category
          }
        ]
      );
      if (!diploma || diploma?.status !== DiplomaStatusEnum.APPROVED) {
        throw new BaseHttpException(ErrorCodeEnum.DIPLOMA_DOESNT_EXIST);
      }
      return {
        ...diploma.dataValues,
        promoVideo: diploma.diplomaDetail?.promoVideo
      };
    } else {
      const course = await this.courseRepo.findOne(
        {
          id
        },
        [
          // {
          //   model: Lecturer,
          //   required: false
          // },
          {
            model: CourseLecturer,
            include: [{ model: Lecturer }]
          },
          {
            model: CourseDetail
          },
          {
            model: Category
          }
        ]
      );
      if (!course || course?.status !== CourseStatusEnum.APPROVED) {
        throw new BaseHttpException(ErrorCodeEnum.COURSE_DOESNT_EXIST);
      }
      return {
        ...course.dataValues,
        promoVideo: course.courseDetail?.promoVideo
      };
    }
  }
  async getDiplomaPrograms(diplomaId: string): Promise<Course[]> {
    const diplomaCourses = await this.diplomaCoursesRepo.findAll(
      {
        diplomaId,
        keptForOldAssignments: false
      },
      [{ model: Course }]
    );
    const courses = diplomaCourses.map(dc => dc.course);
    return courses;
  }
  async getItemCategoryId(item: CartItem | any): Promise<string> {
    return (
      await this.getLearningProgram(
        item.learningProgramId,
        item.learningProgramType
      )
    )?.categoryId;
  }
  // async getDiplomaAdjustedPrice(
  //   learningProgramId: string,
  //   priceAfterDiscount: number,
  //   user: User,
  //   transaction?: Transaction
  // ): Promise<number> {
  //   console.log('diploma.priceAfterDiscount', priceAfterDiscount);

  //   // if (priceAfterDiscount <= 0) {
  //   //   return 0;
  //   // }
  //   const diplomaCourses = await this.diplomaCoursesRepo.findAll(
  //     {
  //       diplomaId: learningProgramId,
  //       keptForOldAssignments: false
  //     },
  //     [{ model: Course }],
  //     undefined,
  //     undefined,
  //     undefined,
  //     transaction
  //   );
  //   console.log(
  //     'diplomaCourses',
  //     diplomaCourses.map(dc => dc.priceOfCourseUnderDiploma)
  //   );

  //   const diplomaCoursesThatUserIsAssignedTo = (
  //     await this.usersAssignedCoursesRepo.findAll(
  //       {
  //         userId: user.id,
  //         courseId: diplomaCourses.map(dc => dc.course.id)
  //       },
  //       [{ model: Course }]
  //     )
  //   ).map(e => e.course);

  //   if (!diplomaCoursesThatUserIsAssignedTo.length) {
  //     return null; // this would be used in the method where this method is called if (adjustedPrice !== null) { addPriceMessage = true;{}
  //   }

  //   const common = diplomaCourses.filter(dc =>
  //     diplomaCoursesThatUserIsAssignedTo.map(dc => dc.id).includes(dc.course.id)
  //   );

  //   const amount = common.reduce((acc, dc) => {
  //     return acc + dc.priceOfCourseUnderDiploma;
  //   }, 0);

  //   console.log('priceAfterDiscount', priceAfterDiscount, 'amount', amount);

  //   return Math.floor(priceAfterDiscount / 100 - amount / 100) * 100;
  // }

  async getDiplomaAdjustedPrice(
    learningProgramId: string,
    priceAfterDiscount: number,
    user: User,
    transaction?: Transaction
  ): Promise<number | null> {
    const diplomaCourses = await this.diplomaCoursesRepo.findAll(
      {
        diplomaId: learningProgramId,
        keptForOldAssignments: false
      },
      [{ model: Course }],
      undefined,
      undefined,
      undefined,
      transaction
    );

    const assignedCourses = (
      await this.usersAssignedCoursesRepo.findAll(
        {
          userId: user.id,
          courseId: diplomaCourses.map(dc => dc.course.id)
        },
        [{ model: Course }]
      )
    ).map(e => e.course.id);

    if (!assignedCourses.length) {
      return null;
    }

    const alreadyPaidAmount = diplomaCourses
      .filter(dc => assignedCourses.includes(dc.course.id))
      .reduce((sum, dc) => sum + dc.priceOfCourseUnderDiploma, 0);

    const adjustedPrice = priceAfterDiscount - alreadyPaidAmount;

    return Math.max(adjustedPrice, 0);
  }
  async countOfDiplomasContainingCourse(
    diplomasCartItems: CartItem[],
    courseId: string
  ): Promise<number> {
    let count = 0;
    for (const diplomaCartItem of diplomasCartItems) {
      const diploma = await this.diplomasRepo.findOne({
        id: diplomaCartItem.learningProgramId
      });
      const diplomaCourses = await this.diplomaCoursesRepo.findAll({
        diplomaId: diploma.id,
        keptForOldAssignments: false
      });
      const courseIds = diplomaCourses.map(dc => dc.courseId);
      if (courseIds?.includes(courseId)) count++;
    }
    console.log('count', count);

    return count;
  }
  // *************************** apply coupon ***************************
  async applyCoupon(currentUser: User, code: string): Promise<ApplyCouponType> {
    let discountAmount = 0;

    const uppercaseCode = code.toUpperCase();
    const coupon = await this.couponsRepo.findOne({ code: uppercaseCode });
    if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
    if (!coupon.isActive)
      throw new BaseHttpException(ErrorCodeEnum.COUPON_IS_NOT_ACTIVE);

    // Check coupon validity
    await this.validateCouponUsage(coupon);

    const cart = await this.cartsRepo.findOne({ userId: currentUser.id }, [
      { model: CartItem }
    ]);
    const { cartItems: items, totalPrice } = cart;

    if (totalPrice === 0) {
      return {
        discountAmount: 0,
        itemDiscountShare: {}
      };
    }

    const {
      discountType,
      discountOff,
      specificIds,
      timesUsed,
      redeemableCount,
      minimumAmount
    } = coupon;
    if (redeemableCount && timesUsed >= redeemableCount) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_REDEEMABLE_COUNT_EXCEEDED
      );
    }

    if (totalPrice < minimumAmount) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_MINIMUM_AMOUNT_NOT_MET);
    }

    // here i would get the eligible items for the coupon
    const eligibleItems: CartItem[] = [];

    switch (coupon.applicabilityCriteria.applicabilityScope) {
      case CouponApplicabilityScopeEnum.GLOBAL:
        eligibleItems.push(...items);
        break;
      case CouponApplicabilityScopeEnum.WORKSHOPS:
        eligibleItems.push(
          ...items.filter(
            item =>
              item.learningProgramType === LearningProgramTypeEnum.WORKSHOP
          )
        );
        break;
      case CouponApplicabilityScopeEnum.DIPLOMAS:
        eligibleItems.push(
          ...items.filter(
            item => item.learningProgramType === LearningProgramTypeEnum.DIPLOMA
          )
        );
        break;
      case CouponApplicabilityScopeEnum.COURSES:
        eligibleItems.push(
          ...items.filter(
            item => item.learningProgramType === LearningProgramTypeEnum.COURSE
          )
        );
        break;
      case CouponApplicabilityScopeEnum.CATEGORIES:
        if (specificIds && specificIds.length) {
          eligibleItems.push(
            ...(
              await Promise.all(
                items.map(async item => {
                  const categoryId = String(await this.getItemCategoryId(item));
                  console.log('categoryId 💛 : ', categoryId);
                  return specificIds.includes(categoryId) ? item : null;
                })
              )
            ).filter(Boolean)
          );
        }
        break;

      case CouponApplicabilityScopeEnum.LECTURERS:
      case CouponApplicabilityScopeEnum.SPECIFIC_PROGRAMS:
        if (specificIds && specificIds.length) {
          eligibleItems.push(
            ...items.filter(item =>
              specificIds.includes(item.learningProgramId)
            )
          );
        }
        break;
    }

    if (!eligibleItems.length) {
      // return {
      //   discountAmount: 0,
      //   itemDiscountShare: {}
      // };
      throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_APPLICABLE);
    }

    //coupon would be applied on the total price of the eligible items
    let totalEligiblePrice = 0;

    const eligibleItemsPrices: { [key: string]: number } = {};
    for (const item of eligibleItems) {
      const itemProgram = await this.getLearningProgram(
        item.learningProgramId,
        item.learningProgramType
      );
      const itemPrice =
        item.adjustedPrice ??
        itemProgram?.priceAfterDiscount ??
        itemProgram.originalPrice;
      eligibleItemsPrices[item.learningProgramId] = itemPrice;
      totalEligiblePrice += itemPrice;
    }

    const discount =
      discountOff && discountType === CouponDiscountTypeEnum.PERCENTAGE ?
        discountOff / 100
      : discountOff;

    discountAmount +=
      discountType === CouponDiscountTypeEnum.PERCENTAGE ?
        (totalEligiblePrice * discount) / 100
      : Math.min(discount, totalEligiblePrice / 100);

    // if the discount amount is greater than the total price of the cart then i would set the discount amount to the total price
    // to prevent negative numbers in the cart
    // for example total price is 100 and discount amount is 120 , discount would be 100 not 120 and priceAfterDiscount would be 0
    console.log('discountAmount', discountAmount, 'totalPrice', totalPrice);
    console.log('-----------------------------');
    if (discountAmount > totalPrice / 100) {
      discountAmount = totalPrice / 100;
    }

    // distribute the discount amount among the eligible items
    const itemDiscountShare: { [key: string]: number } = {};
    for (const item of eligibleItems) {
      const itemPrice = eligibleItemsPrices[item.learningProgramId];
      const discountShare = (itemPrice / totalEligiblePrice) * discountAmount;
      itemDiscountShare[item.id] = discountShare;
    }

    await this.cartsRepo.updateOneFromExistingModel(cart, {
      lastAppliedCoupon: coupon.code
    });

    console.log(
      'discountAmount',
      discountAmount,
      'itemDiscountShare',
      itemDiscountShare
    );

    return {
      discountAmount,
      itemDiscountShare
    };
  }
  // BUY NOW
  async applyCouponForBuyNow(
    coupon: Coupon,
    learningProgramId: string,
    learningProgramType: LearningProgramTypeEnum
  ): Promise<ApplyCouponType> {
    let discountAmount = 0;

    await this.validateCouponUsage(coupon);
    if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
    if (!coupon.isActive)
      throw new BaseHttpException(ErrorCodeEnum.COUPON_IS_NOT_ACTIVE);

    const program = await this.getLearningProgram(
      learningProgramId,
      learningProgramType
    );

    // check if coupon can be applied to this program
    const {
      discountType,
      discountOff,
      specificIds,
      timesUsed,
      redeemableCount,
      minimumAmount,
      applicabilityCriteria
    } = coupon;

    if (redeemableCount && timesUsed >= redeemableCount) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_REDEEMABLE_COUNT_EXCEEDED
      );
    }

    const programPrice = program.priceAfterDiscount ?? program.originalPrice;
    if (programPrice < minimumAmount) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_MINIMUM_AMOUNT_NOT_MET);
    }

    let eligibleItems: any[] = [];

    // Check coupon applicability criteria
    switch (applicabilityCriteria.applicabilityScope) {
      case CouponApplicabilityScopeEnum.GLOBAL:
        eligibleItems.push(program);
        break;
      case CouponApplicabilityScopeEnum.COURSES:
        if (learningProgramType === LearningProgramTypeEnum.COURSE) {
          eligibleItems.push(program);
        }
        break;
      case CouponApplicabilityScopeEnum.DIPLOMAS:
        if (learningProgramType === LearningProgramTypeEnum.DIPLOMA) {
          eligibleItems.push(program);
        }
        break;
      case CouponApplicabilityScopeEnum.WORKSHOPS:
        if (learningProgramType === LearningProgramTypeEnum.WORKSHOP) {
          eligibleItems.push(program);
        }
        break;
      case CouponApplicabilityScopeEnum.CATEGORIES:
        if (specificIds && specificIds.length) {
          const categoryId = String(
            await this.getItemCategoryId({
              learningProgramId: program.id,
              learningProgramType: program.type
            })
          );
          if (specificIds.includes(categoryId)) {
            eligibleItems.push(program);
          }
        }
        break;
      case CouponApplicabilityScopeEnum.SPECIFIC_PROGRAMS:
        if (specificIds && specificIds.includes(learningProgramId)) {
          eligibleItems.push(program);
        }
        break;
    }

    // If no eligible items, return 0 discount
    if (!eligibleItems.length) {
      // return {
      //   discountAmount: 0,
      //   itemDiscountShare: {}
      // };
      throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_APPLICABLE);
    }

    // Calculate the total price of eligible items
    let totalEligiblePrice = 0;
    const eligibleItemsPrices: { [key: string]: number } = {};

    eligibleItems.forEach(item => {
      const itemPrice = item.priceAfterDiscount ?? item.originalPrice;
      eligibleItemsPrices[item.id] = itemPrice;
      totalEligiblePrice += itemPrice;
    });

    // Apply coupon discount
    const discount =
      discountOff && discountType === CouponDiscountTypeEnum.PERCENTAGE ?
        discountOff / 100
      : discountOff;

    discountAmount +=
      discountType === CouponDiscountTypeEnum.PERCENTAGE ?
        (totalEligiblePrice * discount) / 100
      : discount;

    // Ensure discountAmount does not exceed the total price
    if (discountAmount > totalEligiblePrice / 100) {
      discountAmount = totalEligiblePrice / 100;
    }

    // console.log('discountAmount', discountAmount);
    // console.log('totalEligiblePrice', totalEligiblePrice);
    // console.log('------------------------------------');

    // Calculate the discount share per eligible item
    const itemDiscountShare: { [key: string]: number } = {};
    eligibleItems.forEach(item => {
      const itemPrice = eligibleItemsPrices[item.id];
      const discountShare = (itemPrice / totalEligiblePrice) * discountAmount;
      itemDiscountShare[item.id] = discountShare;
    });

    return {
      discountAmount,
      itemDiscountShare
    };
  }
  //----------------------

  async applyCouponOnProgram(
    program: Course | Diploma,
    coupon: Coupon
  ): Promise<ApplyCouponType> {
    let discountAmount = 0;
    await this.validateCouponUsage(coupon);
    if (!coupon.isActive)
      throw new BaseHttpException(ErrorCodeEnum.COUPON_IS_NOT_ACTIVE);
    if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
    const { discountOff, discountType, remoteApplicableFor, minimumAmount } =
      coupon;
    if (program.priceAfterDiscount < minimumAmount) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_MINIMUM_AMOUNT_NOT_MET);
    }
    if (remoteApplicableFor.includes(program.remoteProductId)) {
      const discount =
        discountOff && discountType === CouponDiscountTypeEnum.PERCENTAGE ?
          discountOff / 100
        : discountOff;

      discountAmount +=
        discountType === CouponDiscountTypeEnum.PERCENTAGE ?
          (program.priceAfterDiscount / 100) * discount
        : discount;
    }
    return {
      discountAmount
    };
  }
  async applyCouponOnCartItems(
    cartItems: CreateCartItemInput[],
    couponCode: string
  ): Promise<ApplyCouponType> {
    const uppercaseCode = couponCode.toUpperCase();
    const coupon = await this.couponsRepo.findOne({ code: uppercaseCode });
    await this.validateCouponUsage(coupon);
    if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
    if (!coupon.isActive)
      throw new BaseHttpException(ErrorCodeEnum.COUPON_IS_NOT_ACTIVE);
    let discountAmount = 0;
    if (cartItems.length) {
      for (const cartItem of cartItems) {
        const program = await this.getLearningProgram(
          cartItem.learningProgramId,
          cartItem.learningProgramType
        );
        const { discountAmount: discount } = await this.applyCouponOnProgram(
          program,
          coupon
        );
        discountAmount += discount;
      }
    }
    if (!discountAmount) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_APPLICABLE);
    }
    return {
      discountAmount
    };
  }

  async cancelCoupon(currentUser: User): Promise<ApplyCouponType> {
    const cart = await this.cartsRepo.findOne({ userId: currentUser.id }, [
      { model: CartItem }
    ]);
    await this.cartsRepo.updateOneFromExistingModel(cart, {
      lastAppliedCoupon: null
    });
    return {
      discountAmount: 0
    };
  }
  //******************************* event listeners ******************************* */
  @OnEvent(TRANSACTION_FULFILLED_EVENT, { async: true })
  @Transactional()
  async resetCart(event: AssignUserToLearningProgramEvent): Promise<Cart> {
    console.log('event triggered inside resetCart', event);

    if (!event.resetCart) return;
    const userId = event.userId;
    const cartId = (await this.cartsRepo.findOne({ userId }))?.id;
    console.log('resetting cart...: ', cartId);
    await this.cartItemRepo.deleteAll({ cartId });

    return await this.cartsRepo.updateOne(
      {
        id: cartId
      },
      {
        totalPrice: 0,
        lastAppliedCoupon: null,
        totalQuantity: 0
      }
    );
  }
  // @OnEvent(TRANSACTION_FULFILLED_EVENT, { async: true })
  // @Transactional()
  // async sendTransactionFulfilledNotification(
  //   event: AssignUserToLearningProgramEvent
  // ) {
  //   console.log(
  //     'event triggered inside sendTransactionFulfilledNotification',
  //     event
  //   );
  //   const userId = event.userId;
  //   const to = await this.usersRepo.findAll({ id: userId });
  //   const learningPrograms = event.learningPrograms;
  //   for (const learningProgram of learningPrograms) {
  //     const program = await this.getLearningProgram(
  //       learningProgram.learningProgramId,
  //       learningProgram.learningProgramType
  //     );
  //     await this.pusherQueue.add('pusher', {
  //       toUsers: to.map(t => t.dataValues),
  //       notificationParentId: program.id,
  //       notificationParentType: program.type === LearningProgramTypeEnum.DIPLOMA ? NotificationParentTypeEnum.DIPLOMA : program.type,
  //       payloadData: {
  //         enTitle: `Classes hub`,
  //         arTitle: `لياقة,
  //         enBody: ` You've successfully enrolled in ${program.enTitle} ${program.type}. Start learning now!`,
  //         arBody: `بالتسجيل بنجاح في ${program.arTitle} ${program.type}. ابدأ التعلم الآن`,
  //         notificationType: NotificationTypeEnum.PURCHASE_CONFIRMATION,
  //         type: NotificationTypeEnum.PURCHASE_CONFIRMATION,
  //         url : `https://classeshub.com/learningPrograms/${learningProgram.learningProgramId}`,
  //         clickAction: 'string',
  //       }
  //     });
  //   }
  // }

  async validateCouponUsage(coupon: Coupon) {
    const now = new Date();

    // 1) Coupon has not started yet
    if (coupon.startDate && coupon.startDate > now) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_STARTED);
    }

    // 2) Coupon has expired
    if (coupon.endDate && coupon.endDate < now) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_EXPIRED);
    }

    // 3) Coupon is not active
    if (!coupon.isActive) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_IS_NOT_ACTIVE);
    }

    // 4) Usage count validation
    const { redeemableCount, timesUsed } = coupon;

    // If redeemableCount is 0 → coupon is not valid at all
    if (redeemableCount === 0) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_REDEEMABLE_COUNT_EXCEEDED
      );
    }

    // If redeemableCount is a positive number → coupon has limited usage
    if (redeemableCount != null && timesUsed >= redeemableCount) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_REDEEMABLE_COUNT_EXCEEDED
      );
    }
  }
}
