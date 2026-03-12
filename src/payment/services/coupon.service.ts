import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import { Category } from '@src/course-specs/category/category.model';
import { CourseTypeEnum } from '@src/course/enums/course.enum';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { plural } from 'pluralize';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { PAYMENT_STRATEGY } from '../constants/payment.constants';
import {
  CouponApplicabilityScopeEnum,
  CouponApplicabilityScopeType,
  CouponDiscountTypeEnum,
  CouponStatusEnum
} from '../enums/coupon.enums';
import {
  CouponApplicabilityInput,
  CouponFilterInput,
  CouponSortInput,
  CreateCouponInput,
  UpdateCouponInput
} from '../inputs/coupons.inputs';
import {
  ApplicableForMetadata,
  IApplicabilityCriteriaResults
} from '../interfaces/coupon.interface';
import { IPaymentStrategy } from '../interfaces/payment-strategy.interface';
import { Coupon } from '../models/coupons.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { Cart } from '@src/cart/models/cart.model';

@Injectable()
export class CouponService {
  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(PAYMENT_STRATEGY)
    private readonly paymentStrategy: IPaymentStrategy,
    @Inject(Repositories.CouponsRepository)
    private readonly couponsRepository: IRepository<Coupon>,
    @Inject(Repositories.CartsRepository)
    private readonly cartsRepository: IRepository<Cart>,
    private readonly helperService: HelperService
  ) {}

  async createCoupon(createCouponInput: CreateCouponInput): Promise<Coupon> {
    //1. validate coupon input
    await this.validateCouponInput(createCouponInput);

    if (
      createCouponInput.discount.discountType === CouponDiscountTypeEnum.FREE
    ) {
      createCouponInput.discount.discountType =
        CouponDiscountTypeEnum.PERCENTAGE;
      createCouponInput.discount.discountOff = 100;
    }

    //2. check if coupon code already exists
    if (
      await this.couponsRepository.findOne({
        code: createCouponInput?.code.toUpperCase()
      })
    ) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_ALREADY_EXISTS);
    }

    //3. get applicable programs
    const { remoteApplicableFor, applicableForMetadata } =
      await this.getApplicablePrograms(createCouponInput.applicabilityCriteria);

    //4. create coupon
    const coupon = await this.couponsRepository.createOne({
      code: createCouponInput.code,
      enTitle: createCouponInput.enTitle,
      arTitle: createCouponInput?.arTitle ?? null,
      slug: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.COUPON,
        this.couponsRepository
      ),
      discountOff: createCouponInput?.discount?.discountOff ?? 100,
      discountType: createCouponInput?.discount?.discountType,
      redeemableCount: createCouponInput?.redeemableCount ?? null,
      remoteApplicableFor,
      applicableForMetadata,
      applicabilityCriteria: createCouponInput.applicabilityCriteria,
      applicability: createCouponInput.applicabilityCriteria.applicabilityScope,
      specificIds: createCouponInput.applicabilityCriteria.applicableToIds,
      endDate: new Date(createCouponInput.endDate),
      ...createCouponInput,
      redeemableOnce: createCouponInput?.restrictions?.redeemableOnce ?? false,
      minimumAmount: createCouponInput?.restrictions?.minimumAmount ?? 0,
      timesUsed: 0,
      isActive: createCouponInput?.isActive ?? false
    });

    // if (coupon.startDate <= new Date()) {
    //   const remoteCouponId =
    //     await this.paymentStrategy.createRemoteCoupon(coupon);

    //   coupon.remoteCouponId = remoteCouponId;
    //   await coupon.save();
    // }

    return coupon;
  }

  // async updateCoupon(updateCouponInput: UpdateCouponInput): Promise<Coupon> {
  //   const coupon = await this.getCoupon(updateCouponInput.id);
  //   //1. validate coupon input
  //   await this.validateCouponInput(updateCouponInput);
  //   if (
  //     updateCouponInput.discount.discountType === CouponDiscountTypeEnum.FREE
  //   ) {
  //     updateCouponInput.discount.discountType =
  //       CouponDiscountTypeEnum.PERCENTAGE;
  //     updateCouponInput.discount.discountOff = 100;
  //   }

  //   //2. get applicable programs
  //   const { remoteApplicableFor, applicableForMetadata } =
  //     await this.getApplicablePrograms(updateCouponInput.applicabilityCriteria);

  //   const newUpdatedCoupon =
  //     await this.couponsRepository.updateOneFromExistingModel(coupon, {
  //       //3. check if coupon code already exists if not update
  //       ...(updateCouponInput.code !== coupon.code && {
  //         code: updateCouponInput.code
  //       }),
  //       enTitle: updateCouponInput.enTitle,
  //       arTitle: updateCouponInput?.arTitle ?? null,
  //       discountOff:
  //         updateCouponInput?.discount?.discountOff ?? coupon.discountOff,
  //       discountType:
  //         updateCouponInput?.discount?.discountType ?? coupon.discountType,
  //       redeemableCount:
  //         updateCouponInput?.redeemableCount ?? coupon.redeemableCount,
  //       remoteApplicableFor,
  //       applicableForMetadata,
  //       applicabilityCriteria:
  //         updateCouponInput.applicabilityCriteria ??
  //         coupon.applicabilityCriteria,
  //       applicability:
  //         updateCouponInput.applicabilityCriteria.applicabilityScope ??
  //         coupon.applicability,
  //       endDate: new Date(updateCouponInput?.endDate),
  //       ...updateCouponInput,
  //       redeemableOnce:
  //         updateCouponInput?.restrictions?.redeemableOnce ??
  //         coupon.redeemableOnce,
  //       minimumAmount: updateCouponInput?.restrictions?.minimumAmount || 0,
  //       timesUsed: coupon.timesUsed,
  //       isActive: updateCouponInput?.isActive ?? coupon.isActive
  //     });

  //   // if (
  //   //   coupon.startDate !== newUpdatedCoupon.startDate &&
  //   //   newUpdatedCoupon.startDate <= new Date()
  //   // ) {
  //   //   const remoteCouponId =
  //   //     await this.paymentStrategy.createRemoteCoupon(coupon);

  //   //   newUpdatedCoupon.remoteCouponId = remoteCouponId;
  //   //   await newUpdatedCoupon.save();
  //   // }
  //   return newUpdatedCoupon;
  // }

  async updateCoupon(updateCouponInput: UpdateCouponInput): Promise<Coupon> {
    const coupon = await this.getCoupon(updateCouponInput.id);
    // 1. validate coupon input
    await this.validateCouponInput(updateCouponInput);
    if (
      updateCouponInput.discount.discountType === CouponDiscountTypeEnum.FREE
    ) {
      updateCouponInput.discount.discountType =
        CouponDiscountTypeEnum.PERCENTAGE;
      updateCouponInput.discount.discountOff = 100;
    }

    //2. get applicable programs
    const { remoteApplicableFor, applicableForMetadata } =
      await this.getApplicablePrograms(updateCouponInput.applicabilityCriteria);

    //3. update coupon
    const newUpdatedCoupon =
      await this.couponsRepository.updateOneFromExistingModel(coupon, {
        //3. check if coupon code already exists if not update
        ...(updateCouponInput.code !== coupon.code && {
          code: updateCouponInput.code
        }),
        enTitle: updateCouponInput.enTitle,
        arTitle: updateCouponInput?.arTitle ?? null,
        discountOff:
          updateCouponInput?.discount?.discountOff ?? coupon.discountOff,
        discountType:
          updateCouponInput?.discount?.discountType ?? coupon.discountType,
        redeemableCount:
          updateCouponInput?.redeemableCount ?? coupon.redeemableCount,
        remoteApplicableFor,
        applicableForMetadata,
        applicabilityCriteria:
          updateCouponInput.applicabilityCriteria ??
          coupon.applicabilityCriteria,
        specificIds:
          updateCouponInput?.applicabilityCriteria?.applicableToIds ??
          coupon.specificIds,
        applicability:
          updateCouponInput.applicabilityCriteria.applicabilityScope ??
          coupon.applicability,
        endDate: new Date(updateCouponInput?.endDate),
        ...updateCouponInput,
        redeemableOnce:
          updateCouponInput?.restrictions?.redeemableOnce ??
          coupon.redeemableOnce,
        minimumAmount: updateCouponInput?.restrictions?.minimumAmount || 0,
        timesUsed: coupon.timesUsed,
        isActive: updateCouponInput?.isActive ?? coupon.isActive
      });

    // 4. clear coupon from all carts that are using it
    await this.cartsRepository.updateAll(
      { lastAppliedCoupon: coupon.code },
      { lastAppliedCoupon: null }
    );

    // if (
    //   coupon.startDate !== newUpdatedCoupon.startDate &&
    //   newUpdatedCoupon.startDate <= new Date()
    // ) {
    //   const remoteCouponId =
    //     await this.paymentStrategy.createRemoteCoupon(coupon);

    //   newUpdatedCoupon.remoteCouponId = remoteCouponId;
    //   await newUpdatedCoupon.save();
    // }

    return newUpdatedCoupon;
  }

  async deleteCoupon(id: string): Promise<Coupon> {
    const coupon = await this.getCoupon(id);
    if (coupon.remoteCouponId)
      await this.paymentStrategy.deleteRemoteCoupon(coupon);
    await this.couponsRepository.deleteAll({ id });
    return coupon;
  }

  async getCoupons(
    filter: CouponFilterInput,
    sort: CouponSortInput,
    paginate: PaginatorInput
  ): Promise<PaginationRes<Coupon>> {
    const today = new Date();
    return await this.couponsRepository.findPaginated(
      {
        ...(filter?.searchKey && {
          [Op.or]: [
            { code: { [Op.iLike]: `%${filter?.searchKey}%` } },
            { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } }
          ]
        }),
        ...(filter?.code && {
          code: filter?.code
        }),
        ...(filter?.discountType && { discountType: filter?.discountType }),
        ...(filter?.discountOff && {
          discountOff: {
            [Op.gte]: filter?.discountOff?.from ?? 0,
            [Op.lte]: filter?.discountOff?.to ?? Infinity
          }
        }),
        ...(filter?.activationDateFilter && {
          startDate: {
            [Op.gte]: filter?.activationDateFilter?.from ?? today
          },
          endDate: {
            [Op.lte]: filter?.activationDateFilter?.to ?? today
          }
        }),
        ...(filter?.applicabilityType && {
          applicability: filter?.applicabilityType
        }),
        ...(filter?.status &&
          (filter.status === CouponStatusEnum.EXPIRED ?
            {
              endDate: {
                [Op.lt]: today
              }
            }
          : filter.status === CouponStatusEnum.INACTIVE ?
            {
              [Op.or]: [
                {
                  isActive: false
                },
                {
                  startDate: {
                    [Op.gt]: today
                  }
                }
                // {
                //   remoteCouponId: null
                // }
              ]
            }
          : {
              isActive: true,
              startDate: {
                [Op.lte]: today
              },
              endDate: {
                [Op.gte]: today
              }
              // remoteCouponId: {
              //   [Op.ne]: null
              // }
            }))
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      paginate?.page || 1,
      paginate?.limit || 15
    );
  }

  async getCoupon(id: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({ id });

    if (!coupon) throw new BaseHttpException(ErrorCodeEnum.COUPON_NOT_FOUND);
    return coupon;
  }

  async updateCouponStatus(id: string): Promise<Coupon> {
    const coupon = await this.getCoupon(id);
    // if (!coupon.remoteCouponId) {
    //   throw new BaseHttpException(
    //     ErrorCodeEnum.COUPON_HAS_NOT_BEEN_SYNCED_WITH_THE_PAYMENT_PROVIDER_YET
    //   );
    // }
    return await this.couponsRepository.updateOneFromExistingModel(coupon, {
      isActive: !coupon.isActive
      // ...(coupon?.remoteCouponId && {
      //   remoteCouponId: await this.paymentStrategy.updateRemoteCouponStatus(
      //     coupon,
      //     !coupon.isActive
      //   )
      // })
    });
  }

  async createRemoteCoupons(): Promise<void> {
    try {
      const coupons = await this.couponsRepository.findAll({
        remoteCouponId: null,
        startDate: {
          [Op.lte]: new Date()
        }
      });
      for (const coupon of coupons) {
        await this.couponsRepository.updateOneFromExistingModel(coupon, {
          remoteCouponId: await this.paymentStrategy.createRemoteCoupon(coupon)
        });
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async updateCouponsApplicability(): Promise<void> {
    try {
      const coupons = await this.couponsRepository.findAll({
        startDate: {
          [Op.lte]: new Date()
        }
      });
      for (const coupon of coupons) {
        const { remoteApplicableFor, applicableForMetadata } =
          await this.getApplicablePrograms(coupon.applicabilityCriteria);
        if (coupon.remoteApplicableFor.length < remoteApplicableFor.length) {
          await this.paymentStrategy.updateRemoteCouponApplicability(coupon);
          await this.couponsRepository.updateOneFromExistingModel(coupon, {
            remoteApplicableFor,
            applicableForMetadata
          });
        }
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
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

  private async validateCouponInput(
    couponInput: CreateCouponInput | UpdateCouponInput
  ): Promise<void> {
    // zero time part for "today" (local)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Today : ', today);

    // convert input values to Date
    const startDate =
      couponInput?.startDate ? new Date(couponInput.startDate) : null;
    const endDate = couponInput?.endDate ? new Date(couponInput.endDate) : null;

    // helper to get date-only (midnight) copy
    const toDateOnly = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    // --- Basic checks ---

    if (couponInput?.redeemableCount < 0) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_REDEEMABLE_COUNT_INVALID
      );
    }

    if (
      !startDate ||
      !endDate ||
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_DATES_REQUIRED);
    }

    const startDay = toDateOnly(startDate);
    const endDay = toDateOnly(endDate);

    console.log('startDay : ', startDay);
    console.log('endDay : ', endDay);

    // end must be >= start
    if (startDay > endDay) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_START_AFTER_END);
    }

    // start must not be in the past
    if (startDay < today) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_SHOULD_NOT_START_IN_PAST
      );
    }

    // end must not be in the past
    if (endDay < today) {
      throw new BaseHttpException(ErrorCodeEnum.COUPON_END_IN_PAST);
    }

    // --- Discount sanity checks ---
    if (
      couponInput?.discount?.discountType === CouponDiscountTypeEnum.PERCENTAGE
    ) {
      if (
        couponInput?.discount?.discountOff == null ||
        couponInput?.discount?.discountOff > 100 ||
        couponInput?.discount?.discountOff < 0
      ) {
        throw new BaseHttpException(ErrorCodeEnum.COUPON_PERCENTAGE_INVALID);
      }
    }

    if (couponInput?.discount?.discountType === CouponDiscountTypeEnum.AMOUNT) {
      if (
        couponInput?.discount?.discountOff == null ||
        couponInput?.discount?.discountOff < 0
      ) {
        throw new BaseHttpException(ErrorCodeEnum.COUPON_AMOUNT_INVALID);
      }
    }

    if (couponInput?.discount?.discountType === CouponDiscountTypeEnum.FREE) {
      if (couponInput?.discount?.discountOff != null) {
        throw new BaseHttpException(
          ErrorCodeEnum.COUPON_FREE_SHOULD_NOT_HAVE_AMOUNT
        );
      }
    }

    // --- Activation check ---
    if (couponInput?.isActive && startDay > today) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_CANNOT_ACTIVATE_IN_FUTURE
      );
    }

    // --- Applicability IDs validation ---
    if (
      [
        CouponApplicabilityScopeEnum.SPECIFIC_PROGRAMS,
        CouponApplicabilityScopeEnum.LECTURERS,
        CouponApplicabilityScopeEnum.CATEGORIES
      ].includes(couponInput.applicabilityCriteria.applicabilityScope) &&
      !couponInput.applicabilityCriteria.applicableToIds
    ) {
      throw new BaseHttpException(
        ErrorCodeEnum.COUPON_APPLICABILITY_IDS_REQUIRED
      );
    }
  }

  private async getApplicablePrograms(
    applicabilityCriteria: CouponApplicabilityInput
  ): Promise<IApplicabilityCriteriaResults> {
    const { applicabilityScope, applicableToIds } = applicabilityCriteria || {};

    const scopeHandlers: Record<
      CouponApplicabilityScopeEnum,
      () => Promise<IApplicabilityCriteriaResults>
    > = {
      [CouponApplicabilityScopeEnum.GLOBAL]: () =>
        this.getProgramsForGlobalScope(),
      [CouponApplicabilityScopeEnum.SPECIFIC_PROGRAMS]: () =>
        this.getProgramsForSpecificPrograms(applicableToIds ?? []),
      [CouponApplicabilityScopeEnum.CATEGORIES]: () =>
        this.getProgramsForCategories(applicableToIds ?? []),
      [CouponApplicabilityScopeEnum.LECTURERS]: () =>
        this.getProgramsForLecturers(applicableToIds ?? []),
      [CouponApplicabilityScopeEnum.WORKSHOPS]: () =>
        this.getProgramsForType(
          CouponApplicabilityScopeEnum.WORKSHOPS,
          applicableToIds ?? []
        ),
      [CouponApplicabilityScopeEnum.DIPLOMAS]: () =>
        this.getProgramsForType(
          CouponApplicabilityScopeEnum.DIPLOMAS,
          applicableToIds ?? []
        ),
      [CouponApplicabilityScopeEnum.COURSES]: () =>
        this.getProgramsForType(
          CouponApplicabilityScopeEnum.COURSES,
          applicableToIds ?? []
        )
    };

    return (
      scopeHandlers[applicabilityScope]?.() ?? {
        remoteApplicableFor: [],
        applicableForMetadata: []
      }
    );
  }

  private async getProgramsForGlobalScope(): Promise<IApplicabilityCriteriaResults> {
    const [workshops, courses, diplomas] = await Promise.all([
      this.fetchPrograms(CouponApplicabilityScopeEnum.WORKSHOPS, {
        type: CourseTypeEnum.WORKSHOP
      }),
      this.fetchPrograms(CouponApplicabilityScopeEnum.COURSES, {
        type: CourseTypeEnum.COURSE
      }),
      this.fetchPrograms(CouponApplicabilityScopeEnum.DIPLOMAS, {})
    ]);

    return {
      remoteApplicableFor: [...workshops, ...courses, ...diplomas],
      applicableForMetadata: []
    };
  }
  private async getProgramsForSpecificPrograms(
    ids: string[]
  ): Promise<IApplicabilityCriteriaResults> {
    const [workshops, diplomas, courses] = await Promise.all([
      this.fetchPrograms(CouponApplicabilityScopeEnum.WORKSHOPS, {
        id: { [Op.in]: ids },
        type: CourseTypeEnum.WORKSHOP
      }),
      this.fetchPrograms(CouponApplicabilityScopeEnum.DIPLOMAS, {
        id: { [Op.in]: ids }
      }),
      this.fetchPrograms(CouponApplicabilityScopeEnum.COURSES, {
        id: { [Op.in]: ids },
        type: CourseTypeEnum.COURSE
      })
    ]);

    return {
      remoteApplicableFor: [...workshops, ...diplomas, ...courses],
      applicableForMetadata: await this.getProgramsMetadata(ids)
    };
  }

  private async getProgramsForCategories(
    ids: string[]
  ): Promise<IApplicabilityCriteriaResults> {
    return {
      remoteApplicableFor: await this.fetchProgramsByCategory(ids),
      applicableForMetadata: await this.getCategoriesMetadata(ids)
    };
  }

  private async getProgramsForLecturers(
    ids: string[]
  ): Promise<IApplicabilityCriteriaResults> {
    return {
      remoteApplicableFor: await this.fetchProgramsByLecturer(ids),
      applicableForMetadata: await this.getLecturersMetadata(ids)
    };
  }

  private async getProgramsForType(
    scope: CouponApplicabilityScopeEnum,
    ids: string[]
  ): Promise<IApplicabilityCriteriaResults> {
    return {
      remoteApplicableFor: await this.fetchPrograms(scope, {
        ...(!!ids.length ? { id: { [Op.in]: ids } } : {})
      }),
      applicableForMetadata: await this.getProgramsMetadata(ids)
    };
  }

  private async fetchPrograms(
    scope: CouponApplicabilityScopeEnum,
    filter: WhereOptions<Diploma | Course>
  ): Promise<string[]> {
    const repository = await this.getScopRepository<Diploma | Course>(scope);

    const { lecturerId, ...restFilter } = filter as any;

    const where = restFilter;

    if (lecturerId) {
      const results = await repository.findAll(where, [
        {
          model: CourseLecturer,
          // required: true,
          where: { lecturerId }
        }
      ]);
      return results?.map(item => item.remoteProductId) ?? [];
    } else {
      const results = await repository.findAll(where);
      return results?.map(item => item.remoteProductId) ?? [];
    }
  }

  private async fetchProgramsByCategory(ids: string[]): Promise<string[]> {
    return this.fetchProgramsForMultipleScopes(
      [
        CouponApplicabilityScopeEnum.COURSES,
        CouponApplicabilityScopeEnum.WORKSHOPS,
        CouponApplicabilityScopeEnum.DIPLOMAS
      ],
      { categoryId: { [Op.in]: ids.map(id => parseInt(id)) } }
    );
  }

  private async fetchProgramsByLecturer(ids: string[]): Promise<string[]> {
    return this.fetchProgramsForMultipleScopes(
      [
        CouponApplicabilityScopeEnum.COURSES,
        CouponApplicabilityScopeEnum.WORKSHOPS
      ],
      { lecturerId: { [Op.in]: ids } }
    );
  }

  private async fetchProgramsForMultipleScopes(
    scopes: CouponApplicabilityScopeEnum[],
    filter: WhereOptions<Diploma | Course> | any
  ): Promise<string[]> {
    const results = await Promise.all(
      scopes?.map(scope => this.fetchPrograms(scope, filter))
    );
    return results.flat();
  }

  private async getProgramsMetadata(
    ids: string[]
  ): Promise<ApplicableForMetadata[]> {
    return this.fetchMetadataForPrograms(ids, [
      CouponApplicabilityScopeEnum.WORKSHOPS,
      CouponApplicabilityScopeEnum.COURSES,
      CouponApplicabilityScopeEnum.DIPLOMAS
    ]);
  }

  private async getCategoriesMetadata(
    ids: string[]
  ): Promise<ApplicableForMetadata[]> {
    const repository = await this.getScopRepository<Category>(
      CouponApplicabilityScopeEnum.CATEGORIES
    );
    const categories = await repository.findAll({
      id: { [Op.in]: ids.map(id => parseInt(id)) }
    });

    return categories.map(category => ({
      id: `${category.id}`,
      image: null,
      enTitle: category?.enName,
      arTitle: category?.arName,
      type: CouponApplicabilityScopeEnum.CATEGORIES,
      slug: null
    }));
  }

  private async getLecturersMetadata(
    ids: string[]
  ): Promise<ApplicableForMetadata[]> {
    const repository = await this.getScopRepository<Lecturer>(
      CouponApplicabilityScopeEnum.LECTURERS
    );
    const lecturers = await repository.findAll({ id: { [Op.in]: ids } }, [
      'user'
    ]);

    return (
      lecturers?.map(lecturer => ({
        id: lecturer.id,
        image: lecturer?.user?.profilePicture,
        enTitle: lecturer?.user?.enFullName,
        arTitle: lecturer?.user?.arFullName,
        type: CouponApplicabilityScopeEnum.LECTURERS,
        slug: lecturer?.user?.code
      })) ?? []
    );
  }

  private async fetchMetadataForPrograms(
    ids: string[],
    scopes: CouponApplicabilityScopeEnum[]
  ): Promise<ApplicableForMetadata[]> {
    const metadata = await Promise.all(
      scopes.map(async scope => {
        const repository = await this.getScopRepository<Diploma | Course>(
          scope
        );
        const results = await repository.findAll({ id: { [Op.in]: ids } });

        return (
          results?.map(item => ({
            id: item.id,
            image: item.thumbnail,
            enTitle: item.enTitle,
            arTitle: item.arTitle,
            type: scope,
            slug: item.code
          })) ?? []
        );
      })
    );

    return metadata.flat();
  }

  private async getScopRepository<T extends CouponApplicabilityScopeType>(
    scope: CouponApplicabilityScopeEnum
  ): Promise<IRepository<T>> {
    const nonRepoScopes = [
      CouponApplicabilityScopeEnum.GLOBAL,
      CouponApplicabilityScopeEnum.SPECIFIC_PROGRAMS
    ];
    if (nonRepoScopes.includes(scope)) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }
    return this.moduleRef.get(
      `${plural(
        scope === CouponApplicabilityScopeEnum.WORKSHOPS ?
          CouponApplicabilityScopeEnum.COURSES
        : scope
      )}Repository`,
      {
        strict: false
      }
    ) as IRepository<T>;
  }
}
