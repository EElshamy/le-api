import { Inject, Injectable } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import {
  FinancialAnalytics,
  MonthlyAnalyticsResult,
  YearlyAnalyticsResult
} from './types/financial-analytics.type';
import { TransactionStatusEnum } from '@src/payment/enums/transaction-status.enum';
import { Transaction } from '@src/payment/models/transaction.model';
import { LearningProgramRevenueShare } from '@src/payment/models/revenue-share.model';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { PlatformGrowthAnalytics } from './types/platform-growth-analytics.type';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { LearningProgramsAnalytics } from './types/learning-programs-analytics.type';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import {
  CourseStatusEnum,
  CourseTypeEnum
} from '@src/course/enums/course.enum';
import { DiplomaStatusEnum } from '@src/diploma/enums/diploma-status.enum';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { Category } from '@src/course-specs/category/category.model';
import { IntructorsAnalytics } from './types/instructors-analytics.type';
import { LecturerRequest } from '@src/lecturer/models/lecturer.request.model';
import { ApprovalStatusEnum } from '@src/lecturer/enums/lecturer.enum';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { LearnersInsightsAnalytics } from './types/learners-insights-analytics.type';
import { Review } from '@src/reviews/review.model';
import { SupportAndFeedbackAnalytics } from './types/support-and-feedback-analytics.type';
import { ReportTargetEnum } from '@src/report/enums/report-targets.enum';
import { ReportStatusEnum } from '@src/report/enums/report-status.enum';
import { ContentReport } from '@src/report/models/report.model';
import { LearningProgramTypeForAnalyticsEnum } from '@src/cart/enums/cart.enums';
import { LearningProgramRevenueAnalytics } from './types/course-revenue-analytics';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { Purchase } from '@src/cart/models/purchase.model';
import { DiplomaTypeEnum } from '@src/diploma/enums/diploma-type.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize
  ) {}

  //##################################### Financial Analytics #####################################
  async getFinancialAnalytics(year?: number): Promise<FinancialAnalytics> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = currentYear - 11;

    if (year) {
      // Case 1: Monthly analytics for the specified year

      // Get revenue shares (platform, instructor, vat, paymentGatewayVat)
      const revenueResults = (await LearningProgramRevenueShare.findAll({
        attributes: [
          [
            this.sequelize.literal(
              `EXTRACT(MONTH FROM "LearningProgramRevenueShare"."createdAt")`
            ),
            'month'
          ],
          [
            this.sequelize.fn('SUM', this.sequelize.col('systemShare')),
            'platform'
          ],
          [
            this.sequelize.fn('SUM', this.sequelize.col('lecturerShare')),
            'instructor'
          ],
          [this.sequelize.fn('SUM', this.sequelize.col('vatAmount')), 'vat'],
          [
            this.sequelize.fn(
              'SUM',
              this.sequelize.col('paymentGateWayVatAmount')
            ),
            'paymentGatewayVat'
          ]
        ],
        include: [
          {
            model: Transaction,
            as: 'transaction',
            attributes: [],
            where: {
              status: TransactionStatusEnum.SUCCESS,
              createdAt: {
                [Op.between]: [
                  new Date(`${year}-01-01T00:00:00Z`),
                  new Date(`${year}-12-31T23:59:59Z`)
                ]
              }
            }
          }
        ],
        group: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "LearningProgramRevenueShare"."createdAt")`
          ) as any
        ],
        order: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "LearningProgramRevenueShare"."createdAt") ASC`
          )
        ],
        raw: true
      })) as unknown as MonthlyAnalyticsResult[];

      // Get total transaction amounts (no join)
      const totalResults = (await Transaction.findAll({
        attributes: [
          [
            this.sequelize.literal(
              `EXTRACT(MONTH FROM "Transaction"."createdAt")`
            ),
            'month'
          ],
          [this.sequelize.fn('SUM', this.sequelize.col('totalAmount')), 'total']
        ],
        where: {
          status: TransactionStatusEnum.SUCCESS,
          createdAt: {
            [Op.between]: [
              new Date(`${year}-01-01T00:00:00Z`),
              new Date(`${year}-12-31T23:59:59Z`)
            ]
          }
        },
        group: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "Transaction"."createdAt")`
          ) as any
        ],
        order: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "Transaction"."createdAt") ASC`
          )
        ],
        raw: true
      })) as any[];

      // Merge both datasets by month
      const chart = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const share = revenueResults.find(r => Number(r.month) === month);
        const total = totalResults.find(t => Number(t.month) === month);

        return {
          enName: this.getEnglishMonthName(i),
          arName: this.getArabicMonthName(i),
          platform: share ? Number(share.platform) : 0,
          instructor: share ? Number(share.instructor) : 0,
          vat: share ? Number(share.vat) : 0,
          paymentGatewayVat: share ? Number(share.paymentGatewayVat) : 0,
          total: total ? Number(total.total) : 0
        };
      });

      // Calculate yearly totals
      const totalPlatform = chart.reduce((a, c) => a + c.platform, 0);
      const totalInstructors = chart.reduce((a, c) => a + c.instructor, 0);
      const totalVat = chart.reduce((a, c) => a + c.vat, 0);
      const totalPaymentGatewayVat = chart.reduce(
        (a, c) => a + c.paymentGatewayVat,
        0
      );
      const totalGMV = chart.reduce((a, c) => a + c.total, 0);

      // Get total refunded transactions for this year
      const totalRefunds =
        (await Transaction.sum('totalAmount', {
          where: {
            status: TransactionStatusEnum.REFUNDED,
            createdAt: {
              [Op.between]: [
                new Date(`${year}-01-01T00:00:00Z`),
                new Date(`${year}-12-31T23:59:59Z`)
              ]
            }
          }
        })) || 0;

      const maxYAxisNumber = Math.ceil(Math.max(...chart.map(c => c.total), 0));

      return {
        chart,
        totalGMV,
        totalPlatform,
        totalInstructors,
        totalRefunds,
        totalVat,
        totalPaymentGatewayVat,
        maxYAxisNumber
      };
    }

    // Case 2: Yearly analytics for the last 12 years

    // Get revenue shares grouped by year
    const revenueResults = (await LearningProgramRevenueShare.findAll({
      attributes: [
        [
          this.sequelize.literal(
            `EXTRACT(YEAR FROM "LearningProgramRevenueShare"."createdAt")`
          ),
          'year'
        ],
        [
          this.sequelize.fn('SUM', this.sequelize.col('systemShare')),
          'platform'
        ],
        [
          this.sequelize.fn('SUM', this.sequelize.col('lecturerShare')),
          'instructor'
        ],
        [this.sequelize.fn('SUM', this.sequelize.col('vatAmount')), 'vat'],
        [
          this.sequelize.fn(
            'SUM',
            this.sequelize.col('paymentGateWayVatAmount')
          ),
          'paymentGatewayVat'
        ]
      ],
      include: [
        {
          model: Transaction,
          as: 'transaction',
          attributes: [],
          where: {
            status: TransactionStatusEnum.SUCCESS,
            createdAt: {
              [Op.between]: [
                new Date(`${startYear}-01-01T00:00:00Z`),
                new Date(`${currentYear}-12-31T23:59:59Z`)
              ]
            }
          }
        }
      ],
      group: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "LearningProgramRevenueShare"."createdAt")`
        ) as any
      ],
      order: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "LearningProgramRevenueShare"."createdAt") ASC`
        )
      ],
      raw: true
    })) as unknown as YearlyAnalyticsResult[];

    // Get total transactions grouped by year
    const totalResults = (await Transaction.findAll({
      attributes: [
        [
          this.sequelize.literal(
            `EXTRACT(YEAR FROM "Transaction"."createdAt")`
          ),
          'year'
        ],
        [this.sequelize.fn('SUM', this.sequelize.col('totalAmount')), 'total']
      ],
      where: {
        status: TransactionStatusEnum.SUCCESS,
        createdAt: {
          [Op.between]: [
            new Date(`${startYear}-01-01T00:00:00Z`),
            new Date(`${currentYear}-12-31T23:59:59Z`)
          ]
        }
      },
      group: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "Transaction"."createdAt")`
        ) as any
      ],
      order: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "Transaction"."createdAt") ASC`
        )
      ],
      raw: true
    })) as any[];

    // Merge both datasets by year
    const chart = Array.from({ length: 12 }, (_, i) => {
      const yearVal = startYear + i;
      const share = revenueResults.find(r => Number(r.year) === yearVal);
      const total = totalResults.find(t => Number(t.year) === yearVal);

      return {
        enName: yearVal.toString(),
        arName: this.convertToArabicDigits(yearVal.toString()),
        platform: share ? Number(share.platform) : 0,
        instructor: share ? Number(share.instructor) : 0,
        vat: share ? Number(share.vat) : 0,
        paymentGatewayVat: share ? Number(share.paymentGatewayVat) : 0,
        total: total ? Number(total.total) : 0
      };
    });

    // Calculate grand totals
    const totalPlatform = chart.reduce((a, c) => a + c.platform, 0);
    const totalInstructors = chart.reduce((a, c) => a + c.instructor, 0);
    const totalVat = chart.reduce((a, c) => a + c.vat, 0);
    const totalPaymentGatewayVat = chart.reduce(
      (a, c) => a + c.paymentGatewayVat,
      0
    );
    const totalGMV = chart.reduce((a, c) => a + c.total, 0);

    // Get total refunded transactions across all years
    const totalRefunds =
      (await Transaction.sum('totalAmount', {
        where: {
          status: TransactionStatusEnum.REFUNDED,
          createdAt: {
            [Op.between]: [
              new Date(`${startYear}-01-01T00:00:00Z`),
              new Date(`${currentYear}-12-31T23:59:59Z`)
            ]
          }
        }
      })) || 0;

    const maxYAxisNumber = Math.ceil(Math.max(...chart.map(c => c.total), 0));

    return {
      chart,
      totalGMV,
      totalPlatform,
      totalInstructors,
      totalRefunds,
      totalVat,
      totalPaymentGatewayVat,
      maxYAxisNumber
    };
  }

  //##################################### Platform Growth & Engagement #####################################

  async getPlatformGrowthAnalytics(
    year?: number
  ): Promise<PlatformGrowthAnalytics> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = currentYear - 11;

    // Case 1: Monthly analytics for a specific year
    if (year) {
      const monthlyResults = (await User.findAll({
        attributes: [
          [this.sequelize.literal(`EXTRACT(MONTH FROM "createdAt")`), 'month'],
          [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
        ],
        where: {
          role: UserRoleEnum.USER,
          email: { [Op.ne]: null },
          createdAt: {
            [Op.between]: [
              new Date(`${year}-01-01T00:00:00Z`),
              new Date(`${year}-12-31T23:59:59Z`)
            ]
          }
        },
        group: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "User"."createdAt")`
          ) as any
        ],
        raw: true
      })) as unknown as { month: number; count: number }[];

      const monthlyMap = new Map(
        monthlyResults.map(r => [Number(r.month), Number(r.count)])
      );

      const chart = Array.from({ length: 12 }, (_, i) => ({
        enName: this.getEnglishMonthName(i),
        arName: this.getArabicMonthName(i),
        newUsersCount: monthlyMap.get(i + 1) || 0
      }));

      const totalNewUsers = [...monthlyMap.values()].reduce((a, b) => a + b, 0);

      const totalUsers = await User.count({
        where: { role: UserRoleEnum.USER, email: { [Op.ne]: null } }
      });

      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);

      const totalActiveUsersInTheLastMonth = await User.count({
        where: {
          lastActiveAt: { [Op.gte]: lastMonth },
          role: UserRoleEnum.USER,
          email: { [Op.ne]: null }
        }
      });

      const totalInactiveUsersInTheLastMonth =
        totalUsers - totalActiveUsersInTheLastMonth;

      const activeUsersPercentage =
        totalUsers > 0 ?
          parseFloat(
            ((totalActiveUsersInTheLastMonth / totalUsers) * 100).toFixed(2)
          )
        : 0;

      const inactiveUsersPercentage =
        totalUsers > 0 ?
          parseFloat(
            ((totalInactiveUsersInTheLastMonth / totalUsers) * 100).toFixed(2)
          )
        : 0;

      const maxYAxisNumber = Math.max(...chart.map(c => c.newUsersCount)) || 0;

      return {
        chart,
        totalNewUsers,
        totalUsers,
        totalActiveUsersInTheLastMonth,
        totalInactiveUsersInTheLastMonth,
        activeUsersPercentage,
        inactiveUsersPercentage,
        maxYAxisNumber
      };
    }

    // Case 2: Yearly analytics for the last 12 years
    const yearlyResults = (await User.findAll({
      attributes: [
        [this.sequelize.literal(`EXTRACT(YEAR FROM "createdAt")`), 'year'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      where: {
        role: UserRoleEnum.USER,
        email: { [Op.ne]: null },
        createdAt: {
          [Op.between]: [
            new Date(`${startYear}-01-01T00:00:00Z`),
            new Date(`${currentYear}-12-31T23:59:59Z`)
          ]
        }
      },
      group: [
        this.sequelize.literal(`EXTRACT(YEAR FROM "User"."createdAt")`) as any
      ],
      raw: true
    })) as unknown as { year: number; count: number }[];

    const yearlyMap = new Map(
      yearlyResults.map(r => [Number(r.year), Number(r.count)])
    );

    const chart = Array.from({ length: 12 }, (_, i) => {
      const yearVal = startYear + i;
      return {
        enName: yearVal.toString(),
        arName: this.convertToArabicDigits(yearVal.toString()),
        newUsersCount: yearlyMap.get(yearVal) || 0
      };
    });

    const totalNewUsersInAllYears = [...yearlyMap.values()].reduce(
      (a, b) => a + b,
      0
    );

    const totalUsers = await User.count({
      where: { role: UserRoleEnum.USER, email: { [Op.ne]: null } }
    });

    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const totalActiveUsersInTheLastMonth = await User.count({
      where: {
        lastActiveAt: { [Op.gte]: lastMonth },
        role: UserRoleEnum.USER,
        email: { [Op.ne]: null }
      }
    });

    const totalInactiveUsersInTheLastMonth =
      totalUsers - totalActiveUsersInTheLastMonth;

    const activeUsersPercentage =
      totalUsers > 0 ?
        parseFloat(
          ((totalActiveUsersInTheLastMonth / totalUsers) * 100).toFixed(2)
        )
      : 0;

    const inactiveUsersPercentage =
      totalUsers > 0 ?
        parseFloat(
          ((totalInactiveUsersInTheLastMonth / totalUsers) * 100).toFixed(2)
        )
      : 0;

    const maxYAxisNumber = Math.max(...chart.map(c => c.newUsersCount)) || 0;

    return {
      chart,
      totalNewUsers: totalNewUsersInAllYears,
      totalUsers,
      totalActiveUsersInTheLastMonth,
      totalInactiveUsersInTheLastMonth,
      activeUsersPercentage,
      inactiveUsersPercentage,
      maxYAxisNumber
    };
  }

  //##################################### Learning Programs #####################################

  async getLearningProgramsAnalytics(
    year?: number
  ): Promise<LearningProgramsAnalytics> {
    // ===============================
    // 1. FILTER DATES BASED ON YEAR
    // ===============================
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = currentYear - 11;

    const whereDate: any = {};
    if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      whereDate.createdAt = { [Op.gte]: start, [Op.lt]: end };
    }

    // ===============================
    // 2. TOTAL PROGRAMS PUBLISHED
    // ===============================
    const [coursesCount, pathsCount, subscriptionsCount] = await Promise.all([
      Course.count({
        where: {
          status: CourseStatusEnum.APPROVED,
          ...(year ? whereDate : {})
        }
      }),
      Diploma.count({
        where: {
          status: DiplomaStatusEnum.APPROVED,
          diplomaType: DiplomaTypeEnum.PATH,
          ...(year ? whereDate : {})
        }
      }),
      Diploma.count({
        where: {
          status: DiplomaStatusEnum.APPROVED,
          diplomaType: DiplomaTypeEnum.SUBSCRIPTION,
          ...(year ? whereDate : {})
        }
      })
    ]);

    const totalProgramsPublished =
      coursesCount + pathsCount + subscriptionsCount;

    // ===============================
    // 3. AVERAGE PROGRAM PRICE
    // ===============================
    const [courseAvg, pathAvg, subscriptionAvg] = await Promise.all([
      Course.findOne({
        attributes: [
          [
            Sequelize.fn(
              'AVG',
              Sequelize.literal(
                `COALESCE("priceAfterDiscount", "originalPrice")`
              )
            ),
            'avgPrice'
          ]
        ],
        where: {
          status: CourseStatusEnum.APPROVED,
          ...(year ? whereDate : {})
        },
        raw: true
      }) as unknown as { avgPrice: number },

      Diploma.findOne({
        attributes: [
          [
            Sequelize.fn(
              'AVG',
              Sequelize.literal(
                `COALESCE("priceAfterDiscount", "originalPrice")`
              )
            ),
            'avgPrice'
          ]
        ],
        where: {
          status: DiplomaStatusEnum.APPROVED,
          diplomaType: DiplomaTypeEnum.PATH,
          ...(year ? whereDate : {})
        },
        raw: true
      }) as unknown as { avgPrice: number },

      Diploma.findOne({
        attributes: [
          [
            Sequelize.fn(
              'AVG',
              Sequelize.literal(
                `COALESCE("priceAfterDiscount", "originalPrice")`
              )
            ),
            'avgPrice'
          ]
        ],
        where: {
          status: DiplomaStatusEnum.APPROVED,
          diplomaType: DiplomaTypeEnum.SUBSCRIPTION,
          ...(year ? whereDate : {})
        },
        raw: true
      }) as unknown as { avgPrice: number }
    ]);

    const avgValues = [
      Number(courseAvg?.avgPrice) || 0,
      Number(pathAvg?.avgPrice) || 0,
      Number(subscriptionAvg?.avgPrice) || 0
    ].filter(v => v > 0);

    const averageProgramPrice =
      avgValues.length > 0 ?
        Math.round(
          (avgValues.reduce((a, b) => a + b, 0) / avgValues.length) * 100
        ) / 100
      : 0;

    // ===============================
    // 4. ENROLLMENTS DATA
    // ===============================
    const whereAssignment: any = {};
    if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      whereAssignment.createdAt = { [Op.gte]: start, [Op.lt]: end };
    } else {
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(currentYear + 1, 0, 1));
      whereAssignment.createdAt = { [Op.gte]: start, [Op.lt]: end };
    }

    const assignments = await UsersAssignment.findAll({
      where: whereAssignment,
      attributes: ['id', 'userId', 'courseId', 'diplomaId', 'createdAt'],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: [
            'id',
            'enTitle',
            'arTitle',
            'type',
            'categoryId',
            'isLiveCourse'
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const diplomaIds = assignments.map(a => a.diplomaId).filter(Boolean);

    const diplomas =
      diplomaIds.length ?
        await Diploma.findAll({
          where: { id: diplomaIds },
          attributes: ['id', 'enTitle', 'arTitle', 'categoryId', 'diplomaType']
        })
      : [];

    const diplomasMap = new Map<string, Diploma>(
      diplomas.map(d => [String(d.id), d])
    );

    // ===============================
    // 5. AGGREGATION
    // ===============================
    const userSet = new Set<string>();
    const diplomaUserPairs = new Set<string>();
    const programCounts = new Map<string, any>();
    const categoryCounts = new Map<number, any>();
    const buckets = new Map<string, any>();

    function getBucketKey(date: Date) {
      return year ?
          String(date.getUTCMonth() + 1).padStart(2, '0')
        : String(date.getUTCFullYear());
    }

    for (const a of assignments as any[]) {
      const userId = a.userId;
      if (userId) userSet.add(String(userId));

      const createdAt = a.createdAt ? new Date(a.createdAt) : new Date();
      const bucketKey = getBucketKey(createdAt);

      if (!buckets.has(bucketKey)) {
        let enName = '';
        let arName = '';
        if (year) {
          const monthIndex = parseInt(bucketKey, 10) - 1;
          enName = this.getEnglishMonthName(monthIndex);
          arName = this.getArabicMonthName(monthIndex);
        } else {
          const y = parseInt(bucketKey, 10);
          enName = y.toString();
          arName = this.convertToArabicDigits(y.toString());
        }

        buckets.set(bucketKey, {
          enName,
          arName,
          coursesCount: 0,
          workshopsCount: 0,
          liveWorkshopsCount: 0,
          pathsCount: 0,
          subscriptionsCount: 0
        });
      }

      const bucket = buckets.get(bucketKey);

      // --- Diplomas (PATH / SUBSCRIPTION) ---
      if (a.diplomaId) {
        const pairKey = `${a.userId}::${a.diplomaId}`;
        if (!diplomaUserPairs.has(pairKey)) {
          diplomaUserPairs.add(pairKey);

          const diplomaModel = diplomasMap.get(String(a.diplomaId));
          const en = diplomaModel?.enTitle || `Diploma ${a.diplomaId}`;
          const ar = diplomaModel?.arTitle || en;

          const isSubscription =
            diplomaModel?.diplomaType === DiplomaTypeEnum.SUBSCRIPTION;

          if (isSubscription) {
            bucket.subscriptionsCount += 1;
          } else {
            bucket.pathsCount += 1;
          }

          const progKey = `diploma::${a.diplomaId}`;
          const existingProg = programCounts.get(progKey) || {
            id: a.diplomaId,
            type: isSubscription ? 'subscription' : 'path',
            enName: en,
            arName: ar,
            count: 0
          };
          existingProg.count += 1;
          programCounts.set(progKey, existingProg);

          const catId = diplomaModel?.categoryId;
          if (catId) {
            const cat = categoryCounts.get(catId) || {
              id: catId,
              enName: null,
              arName: null,
              count: 0
            };
            cat.count += 1;
            categoryCounts.set(catId, cat);
          }
        }
      }

      // --- Courses ---
      else if (a.courseId) {
        const courseModel = a.course as Course;

        if (courseModel?.isLiveCourse) {
          bucket.liveWorkshopsCount += 1;
        } else if (courseModel?.type === CourseTypeEnum.WORKSHOP) {
          bucket.workshopsCount += 1;
        } else {
          bucket.coursesCount += 1;
        }

        const progKey = `course::${a.courseId}`;
        const en = courseModel?.enTitle || `Course ${a.courseId}`;
        const ar = courseModel?.arTitle || en;

        const type =
          courseModel?.isLiveCourse ? 'liveWorkshop' : (
            courseModel?.type?.toLowerCase() || 'course'
          );

        const existingProg = programCounts.get(progKey) || {
          id: a.courseId,
          type,
          enName: en,
          arName: ar,
          count: 0
        };
        existingProg.count += 1;
        programCounts.set(progKey, existingProg);

        const catId = courseModel?.categoryId;
        if (catId) {
          const cat = categoryCounts.get(catId) || {
            id: catId,
            enName: null,
            arName: null,
            count: 0
          };
          cat.count += 1;
          categoryCounts.set(catId, cat);
        }
      }
    }

    // ===============================
    // 6. BUILD CHART BUCKETS
    // ===============================
    const chartKeys =
      year ?
        Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      : Array.from({ length: 12 }, (_, i) => String(startYear + i));

    const enrollmentChartItems = chartKeys.map(key => {
      const b = buckets.get(key) || {
        enName: year ? this.getEnglishMonthName(parseInt(key) - 1) : key,
        arName:
          year ?
            this.getArabicMonthName(parseInt(key) - 1)
          : this.convertToArabicDigits(key),
        coursesCount: 0,
        workshopsCount: 0,
        liveWorkshopsCount: 0,
        pathsCount: 0,
        subscriptionsCount: 0
      };

      const total =
        b.coursesCount +
          b.workshopsCount +
          b.liveWorkshopsCount +
          b.pathsCount +
          b.subscriptionsCount || 0;

      return {
        enName: b.enName,
        arName: b.arName,
        coursesCount: b.coursesCount,
        workshopsCount: b.workshopsCount,
        liveWorkshopsCount: b.liveWorkshopsCount,
        pathsCount: b.pathsCount,
        subscriptionsCount: b.subscriptionsCount,
        coursesPercentage:
          total ? Math.round((b.coursesCount / total) * 10000) / 100 : 0,
        workshopsPercentage:
          total ? Math.round((b.workshopsCount / total) * 10000) / 100 : 0,
        liveWorkshopsPercentage:
          total ? Math.round((b.liveWorkshopsCount / total) * 10000) / 100 : 0,
        pathsPercentage:
          total ? Math.round((b.pathsCount / total) * 10000) / 100 : 0,
        subscriptionsPercentage:
          total ? Math.round((b.subscriptionsCount / total) * 10000) / 100 : 0,
        total
      };
    });

    const totalAcross =
      enrollmentChartItems.reduce((s, it) => s + it.total, 0) || 1;

    const enrollmentChart = {
      chart: enrollmentChartItems,
      coursesPercentage:
        Math.round(
          (enrollmentChartItems.reduce((s, i) => s + i.coursesCount, 0) /
            totalAcross) *
            10000
        ) / 100,
      workshopsPercentage:
        Math.round(
          (enrollmentChartItems.reduce((s, i) => s + i.workshopsCount, 0) /
            totalAcross) *
            10000
        ) / 100,
      liveWorkshopsPercentage:
        Math.round(
          (enrollmentChartItems.reduce((s, i) => s + i.liveWorkshopsCount, 0) /
            totalAcross) *
            10000
        ) / 100,
      pathsPercentage:
        Math.round(
          (enrollmentChartItems.reduce((s, i) => s + i.pathsCount, 0) /
            totalAcross) *
            10000
        ) / 100,
      subscriptionsPercentage:
        Math.round(
          (enrollmentChartItems.reduce((s, i) => s + i.subscriptionsCount, 0) /
            totalAcross) *
            10000
        ) / 100,
      maxYAxisNumber: Math.max(...enrollmentChartItems.map(i => i.total), 0)
    };

    // ===============================
    // 7. TOP PROGRAMS
    // ===============================
    const topProgramsArr = Array.from(programCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map(p => {
        let learningProgramType: LearningProgramTypeForAnalyticsEnum;

        if (p.type === 'path') {
          learningProgramType = LearningProgramTypeForAnalyticsEnum.PATH;
        } else if (p.type === 'subscription') {
          learningProgramType =
            LearningProgramTypeForAnalyticsEnum.SUBSCRIPTION;
        } else if (p.type === 'course') {
          learningProgramType = LearningProgramTypeForAnalyticsEnum.COURSE;
        } else if (p.type === 'liveWorkshop') {
          learningProgramType =
            LearningProgramTypeForAnalyticsEnum.LIVE_WORKSHOP;
        } else {
          learningProgramType = LearningProgramTypeForAnalyticsEnum.WORKSHOP;
        }

        return {
          enName: p.enName,
          arName: p.arName,
          learningProgramType,
          enrollmentsCount: p.count
        };
      });

    const topPrograms = {
      chart: topProgramsArr,
      maxYAxisNumber:
        topProgramsArr.length ?
          Math.max(...topProgramsArr.map(p => p.enrollmentsCount))
        : 0
    };

    // ===============================
    // 8. TOP CATEGORIES
    // ===============================
    const catIdsToFill = Array.from(categoryCounts.keys()).filter(id => {
      const c = categoryCounts.get(id);
      return !c.enName || !c.arName;
    });

    if (catIdsToFill.length > 0) {
      const cats = await Category.findAll({ where: { id: catIdsToFill } });
      for (const c of cats) {
        const entry = categoryCounts.get(c.id);
        if (entry) {
          entry.enName = c.enName;
          entry.arName = c.arName;
        }
      }
    }

    const topCategoriesArr = Array.from(categoryCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map(c => ({
        enName: c.enName || `Category ${c.id}`,
        arName: c.arName || `Category ${c.id}`,
        enrollmentsCount: c.count
      }));

    const topCategories = {
      chart: topCategoriesArr,
      maxYAxisNumber:
        topCategoriesArr.length ?
          Math.max(...topCategoriesArr.map(c => c.enrollmentsCount))
        : 0
    };

    // ===============================
    // 9. SUMMARY
    // ===============================
    const totalEnrollments =
      enrollmentChartItems.reduce((s, it) => s + it.total, 0) || 0;
    const distinctUsersWithEnrollment = userSet.size || 1;
    const enrollmentsRate = Math.round(
      (totalEnrollments / distinctUsersWithEnrollment) * 100
    );

    return {
      totalProgramsPublished,
      totalEnrollments,
      enrollmentsRate,
      averageProgramPrice,
      enrollments: enrollmentChart,
      topPerformingPrograms: topPrograms,
      topPerformingCategories: topCategories
    };
  }

  //##################################### Instructors Management #####################################

  async getInstructorsAnalytics(year?: number): Promise<IntructorsAnalytics> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = currentYear - 11;

    // Helper to build Arabic + English labels
    const getLabels = (i: number) => ({
      en: year ? this.getEnglishMonthName(i) : (startYear + i).toString(),
      ar:
        year ?
          this.getArabicMonthName(i)
        : this.convertToArabicDigits((startYear + i).toString())
    });

    // If a specific year is provided
    if (year) {
      // Get number of lecturer applicants per month in the given year
      const applicantsPerMonth = (await LecturerRequest.findAll({
        attributes: [
          [
            this.sequelize.literal(
              `EXTRACT(MONTH FROM "LecturerRequest"."createdAt")`
            ),
            'month'
          ],
          [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.between]: [
              new Date(`${year}-01-01T00:00:00Z`),
              new Date(`${year}-12-31T23:59:59Z`)
            ]
          }
        },
        group: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "LecturerRequest"."createdAt")`
          ) as any
        ],
        order: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "LecturerRequest"."createdAt") ASC`
          )
        ],
        raw: true
      })) as unknown as { month: number; count: string }[];

      // Build chart for 12 months (January → December)
      const chart = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const found = applicantsPerMonth.find(a => Number(a.month) === month);
        const { en, ar } = getLabels(i);
        return {
          enName: en,
          arName: ar,
          applicantsCount: found ? Number(found.count) : 0
        };
      });

      // Calculate totals
      const totalInstructors = await Lecturer.count({
        where: {
          status: ApprovalStatusEnum.APPROVED,
          createdAt: { [Op.lte]: new Date(`${year}-12-31T23:59:59Z`) }
        }
      });

      const newApplicantsCount = await LecturerRequest.count({
        where: {
          createdAt: {
            [Op.between]: [
              new Date(`${year}-01-01T00:00:00Z`),
              new Date(`${year}-12-31T23:59:59Z`)
            ]
          }
        }
      });

      const approvedInPeriod = await LecturerRequest.count({
        where: {
          status: ApprovalStatusEnum.APPROVED,
          statusChangedAt: {
            [Op.between]: [
              new Date(`${year}-01-01T00:00:00Z`),
              new Date(`${year}-12-31T23:59:59Z`)
            ]
          }
        }
      });

      const approvalRate =
        newApplicantsCount > 0 ?
          parseFloat(((approvedInPeriod / newApplicantsCount) * 100).toFixed(2))
        : 0;

      const maxYAxisNumber =
        Math.max(...chart.map(c => c.applicantsCount)) || 0;

      return {
        chart,
        totalInstructors,
        newApplicantsCount,
        approvalRate,
        maxYAxisNumber
      };
    }

    // If no year is specified → use the last 12 years
    const applicantsPerYear = (await LecturerRequest.findAll({
      attributes: [
        [
          this.sequelize.literal(
            `EXTRACT(YEAR FROM "LecturerRequest"."createdAt")`
          ),
          'year'
        ],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.between]: [
            new Date(`${startYear}-01-01T00:00:00Z`),
            new Date(`${currentYear}-12-31T23:59:59Z`)
          ]
        }
      },
      group: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "LecturerRequest"."createdAt")`
        ) as any
      ],
      order: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "LecturerRequest"."createdAt") ASC`
        )
      ],
      raw: true
    })) as unknown as { year: number; count: string }[];

    // Build chart for 12 years
    const chart = Array.from({ length: 12 }, (_, i) => {
      const yearVal = startYear + i;
      const found = applicantsPerYear.find(a => Number(a.year) === yearVal);
      const { en, ar } = getLabels(i);
      return {
        enName: en,
        arName: ar,
        applicantsCount: found ? Number(found.count) : 0
      };
    });

    // Calculate totals
    const totalInstructors = await Lecturer.count({
      where: {
        status: ApprovalStatusEnum.APPROVED,
        createdAt: { [Op.lte]: new Date(`${currentYear}-12-31T23:59:59Z`) }
      }
    });

    const newApplicantsCount = await LecturerRequest.count({
      where: {
        createdAt: {
          [Op.between]: [
            new Date(`${startYear}-01-01T00:00:00Z`),
            new Date(`${currentYear}-12-31T23:59:59Z`)
          ]
        }
      }
    });

    const approvedInPeriod = await LecturerRequest.count({
      where: {
        status: ApprovalStatusEnum.APPROVED,
        statusChangedAt: {
          [Op.between]: [
            new Date(`${startYear}-01-01T00:00:00Z`),
            new Date(`${currentYear}-12-31T23:59:59Z`)
          ]
        }
      }
    });

    const approvalRate =
      newApplicantsCount > 0 ?
        parseFloat(((approvedInPeriod / newApplicantsCount) * 100).toFixed(2))
      : 0;

    const maxYAxisNumber = Math.max(...chart.map(c => c.applicantsCount)) || 0;

    return {
      chart,
      totalInstructors,
      newApplicantsCount,
      approvalRate,
      maxYAxisNumber
    };
  }

  //##################################### Learner Insights #####################################

  async getLearnersInsightsAnalytics(
    year?: number
  ): Promise<LearnersInsightsAnalytics> {
    // Filter by year if provided
    const whereCondition: any = {};
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      whereCondition.createdAt = {
        [Op.gte]: startOfYear,
        [Op.lt]: endOfYear
      };
    }

    // 1 - Calculate Certificate Completion Rate
    // Fetch all user assignments with completion info
    const allAssignments = await UsersAssignment.findAll({
      where: whereCondition,
      attributes: ['userId', 'courseId', 'completed'],
      raw: true
    });

    // Remove duplicates (same userId + courseId should be treated as one)
    const uniqueAssignmentsMap = new Map<string, boolean>();
    for (const assignment of allAssignments) {
      const key = `${assignment.userId}-${assignment.courseId}`;
      if (!uniqueAssignmentsMap.has(key)) {
        uniqueAssignmentsMap.set(key, assignment.completed);
      } else if (assignment.completed) {
        // If one of the duplicates is completed → mark it as completed
        uniqueAssignmentsMap.set(key, true);
      }
    }

    const totalUniqueAssignments = uniqueAssignmentsMap.size;
    const completedAssignments = Array.from(
      uniqueAssignmentsMap.values()
    ).filter(v => v).length;

    const certificateCompletionRate =
      totalUniqueAssignments > 0 ?
        (completedAssignments / totalUniqueAssignments) * 100
      : 0;

    // 2 - Calculate Programs Satisfaction Score (average rating)
    const reviewWhereCondition: any = {};
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      reviewWhereCondition.createdAt = {
        [Op.gte]: startOfYear,
        [Op.lt]: endOfYear
      };
    }

    // Fetch all reviews
    const reviews = await Review.findAll({
      where: reviewWhereCondition,
      attributes: ['rating'],
      raw: true
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0 ?
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // 3 - Calculate Repeat Enrollment Rate
    // Count how many users enrolled in more than one course
    const userEnrollments = allAssignments.reduce(
      (acc, curr) => {
        if (!acc[curr.userId]) acc[curr.userId] = new Set();
        acc[curr.userId].add(curr.courseId);
        return acc;
      },
      {} as Record<string, Set<string>>
    );

    const totalUsers = Object.keys(userEnrollments).length;
    const usersWithMultipleEnrollments = Object.values(userEnrollments).filter(
      set => set.size > 1
    ).length;

    const repeatEnrollmentRate =
      totalUsers > 0 ? (usersWithMultipleEnrollments / totalUsers) * 100 : 0;

    // Return final insights
    return {
      certificateCompletionRate: Number(certificateCompletionRate.toFixed(2)),
      programsSatisfactionScore: Number(avgRating.toFixed(2)),
      repeatEnrollmentRate: Number(repeatEnrollmentRate.toFixed(2))
    };
  }

  //##################################### Support & Feedback #####################################

  async supportAndFeedbackAnalytics(
    year?: number
  ): Promise<SupportAndFeedbackAnalytics> {
    // Base filter for the reports
    const whereCondition: any = {};

    // If year provided → filter reports created in that year
    if (year) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)]
      };
    }

    // Fetch all reports
    const reports = await ContentReport.findAll({ where: whereCondition });

    // Calculate total reports
    const totalReports = reports.length;

    // Count reports by status
    const resolvedReports = reports.filter(
      r => r.status === ReportStatusEnum.RESOLVED
    ).length;
    const openedReports = reports.filter(
      r => r.status === ReportStatusEnum.OPEN
    ).length;
    const invalidReports = reports.filter(
      r => r.status === ReportStatusEnum.INVALID
    ).length;

    // Calculate percentage for each status (handle division by zero)
    const resolvedReportsPercentage =
      totalReports ? (resolvedReports / totalReports) * 100 : 0;
    const openedReportsPercentage =
      totalReports ? (openedReports / totalReports) * 100 : 0;
    const invalidReportsPercentage =
      totalReports ? (invalidReports / totalReports) * 100 : 0;

    // Count reported targets by type
    const reportedPrograms = reports.filter(r =>
      [
        ReportTargetEnum.COURSE,
        ReportTargetEnum.WORKSHOP,
        ReportTargetEnum.DIPLOMA
      ].includes(r.targetType)
    ).length;
    const reportedInstructors = reports.filter(
      r => r.targetType === ReportTargetEnum.LECTURER
    ).length;
    const reportedComments = reports.filter(
      r => r.targetType === ReportTargetEnum.COMMENT
    ).length;
    const reportedBlogs = reports.filter(
      r => r.targetType === ReportTargetEnum.BLOG
    ).length;
    const reportedReviews = reports.filter(
      r => r.targetType === ReportTargetEnum.REVIEW
    ).length;

    // Get top 12 most common issues
    const issuesCount: Record<string, number> = {};
    for (const r of reports) {
      issuesCount[r.reason] = (issuesCount[r.reason] || 0) + 1;
    }
    const mostCommonIssuesArray = Object.entries(issuesCount)
      .map(([reason, count]) => ({
        enName: reason,
        arName: this.translateIssue(reason),
        reportsCount: count
      }))
      .sort((a, b) => b.reportsCount - a.reportsCount)
      .slice(0, 12);

    // Get max value for chart Y-axis
    const maxYAxisNumberIssues = Math.max(
      ...mostCommonIssuesArray.map(i => i.reportsCount),
      0
    );

    // ===============================
    //  MOST REPORTED PROGRAMS
    // ===============================
    const programReportsCount: Record<
      string,
      { count: number; type: ReportTargetEnum }
    > = {};
    for (const r of reports.filter(r =>
      [
        ReportTargetEnum.COURSE,
        ReportTargetEnum.WORKSHOP,
        ReportTargetEnum.DIPLOMA
      ].includes(r.targetType)
    )) {
      if (!r.targetId) continue;
      if (!programReportsCount[r.targetId]) {
        programReportsCount[r.targetId] = { count: 0, type: r.targetType };
      }
      programReportsCount[r.targetId].count += 1;
    }

    const mostReportedProgramsArray = await Promise.all(
      Object.entries(programReportsCount)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 12)
        .map(async ([targetId, { count, type }]) => {
          // Try to find the program name in Course or Diploma
          const course = await Course.findByPk(targetId);
          const diploma = await Diploma.findByPk(targetId);
          const entity = course || diploma;

          // Determine learningProgramType
          let learningProgramType: LearningProgramTypeForAnalyticsEnum;

          if (course?.isLiveCourse) {
            // If live → count as LIVE_WORKSHOP (even if it's a normal course)
            learningProgramType =
              LearningProgramTypeForAnalyticsEnum.LIVE_WORKSHOP;
          } else if (type === ReportTargetEnum.DIPLOMA && diploma) {
            // Split diplomas between PATH and SUBSCRIPTION
            if (diploma.diplomaType === DiplomaTypeEnum.PATH) {
              learningProgramType = LearningProgramTypeForAnalyticsEnum.PATH;
            } else {
              learningProgramType =
                LearningProgramTypeForAnalyticsEnum.SUBSCRIPTION;
            }
          } else if (type === ReportTargetEnum.WORKSHOP) {
            learningProgramType = LearningProgramTypeForAnalyticsEnum.WORKSHOP;
          } else if (type === ReportTargetEnum.COURSE) {
            learningProgramType = LearningProgramTypeForAnalyticsEnum.COURSE;
          }

          return {
            enName: entity?.enTitle || 'Unknown',
            arName: entity?.arTitle || 'غير معروف',
            learningProgramType,
            reportsCount: count
          };
        })
    );

    const maxYAxisNumberPrograms = Math.max(
      ...mostReportedProgramsArray.map(p => p.reportsCount),
      0
    );

    // ===============================
    //  RETURN FINAL ANALYTICS OBJECT
    // ===============================
    return {
      resolvedReports,
      resolvedReportsPercentage,
      openedReports,
      openedReportsPercentage,
      invalidReports,
      invalidReportsPercentage,
      totalReports,
      reportedPrograms,
      reportedInstructors,
      reportedComments,
      reportedBlogs,
      reportedReviews,
      mostCommonIssues: {
        chart: mostCommonIssuesArray,
        maxYAxisNumber: maxYAxisNumberIssues
      },
      mostReportedPrograms: {
        chart: mostReportedProgramsArray,
        maxYAxisNumber: maxYAxisNumberPrograms
      }
    };
  }

  //##################################### learning program revenue #####################################

  async getlearningProgramRevenueAnalytics(
    programId: string,
    year?: number
  ): Promise<LearningProgramRevenueAnalytics> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = currentYear - 11;

    // get the program transactions
    const transactionDateFilter =
      year ?
        {
          [Op.between]: [
            new Date(`${year}-01-01T00:00:00Z`),
            new Date(`${year}-12-31T23:59:59Z`)
          ]
        }
      : {
          [Op.between]: [
            new Date(`${startYear}-01-01T00:00:00Z`),
            new Date(`${currentYear}-12-31T23:59:59Z`)
          ]
        };

    const transactions = await Transaction.findAll({
      where: {
        status: TransactionStatusEnum.SUCCESS,
        createdAt: transactionDateFilter
      },
      include: [
        {
          model: LearningProgramRevenueShare,
          as: 'revenueShares',
          required: true,
          where: { programId }
        },
        {
          model: Purchase,
          include: [{ model: PurchaseItem }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // If a specific year is selected → group by month
    if (year) {
      const results = (await LearningProgramRevenueShare.findAll({
        attributes: [
          [
            this.sequelize.literal(
              `EXTRACT(MONTH FROM "LearningProgramRevenueShare"."createdAt")`
            ),
            'month'
          ],
          [
            this.sequelize.fn('SUM', this.sequelize.col('systemShare')),
            'platform'
          ],
          [
            this.sequelize.fn('SUM', this.sequelize.col('lecturerShare')),
            'instructor'
          ]
        ],
        where: {
          programId
        },
        include: [
          {
            model: Transaction,
            as: 'transaction',
            attributes: [],
            where: {
              status: TransactionStatusEnum.SUCCESS,
              createdAt: {
                [Op.between]: [
                  new Date(`${year}-01-01T00:00:00Z`),
                  new Date(`${year}-12-31T23:59:59Z`)
                ]
              }
            }
          }
        ],
        group: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "LearningProgramRevenueShare"."createdAt")`
          ) as any
        ],
        order: [
          this.sequelize.literal(
            `EXTRACT(MONTH FROM "LearningProgramRevenueShare"."createdAt") ASC`
          )
        ],
        raw: true
      })) as any[];

      // Build full 12-month chart (ensures missing months are 0)
      const chart = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const row = results.find(r => Number(r.month) === month);

        return {
          enName: this.getEnglishMonthName(index),
          arName: this.getArabicMonthName(index),
          platform: row ? Number(row.platform) : 0,
          instructor: row ? Number(row.instructor) : 0,
          total: row ? Number(row.platform) + Number(row.instructor) : 0
        };
      });

      // Aggregate totals
      const totalPlatform = chart.reduce((sum, c) => sum + c.platform, 0);
      const totalInstructors = chart.reduce((sum, c) => sum + c.instructor, 0);
      const total = chart.reduce((sum, c) => sum + c.total, 0);

      // Used for chart Y-axis scaling
      const maxYAxisNumber = Math.ceil(Math.max(...chart.map(c => c.total), 0));

      return {
        chart,
        totalPlatform,
        totalInstructors,
        total,
        transactions,
        maxYAxisNumber
      };
    }

    // If no year selected → group by year (last 12 years)
    const results = (await LearningProgramRevenueShare.findAll({
      attributes: [
        [
          this.sequelize.literal(
            `EXTRACT(YEAR FROM "LearningProgramRevenueShare"."createdAt")`
          ),
          'year'
        ],
        [
          this.sequelize.fn('SUM', this.sequelize.col('systemShare')),
          'platform'
        ],
        [
          this.sequelize.fn('SUM', this.sequelize.col('lecturerShare')),
          'instructor'
        ]
      ],
      where: {
        programId
      },
      include: [
        {
          model: Transaction,
          as: 'transaction',
          attributes: [],
          where: {
            status: TransactionStatusEnum.SUCCESS,
            createdAt: {
              [Op.between]: [
                new Date(`${startYear}-01-01T00:00:00Z`),
                new Date(`${currentYear}-12-31T23:59:59Z`)
              ]
            }
          }
        }
      ],
      group: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "LearningProgramRevenueShare"."createdAt")`
        ) as any
      ],
      order: [
        this.sequelize.literal(
          `EXTRACT(YEAR FROM "LearningProgramRevenueShare"."createdAt") ASC`
        )
      ],
      raw: true
    })) as any[];

    const chart = Array.from({ length: 12 }, (_, index) => {
      const yearVal = startYear + index;
      const row = results.find(r => Number(r.year) === yearVal);

      return {
        enName: yearVal.toString(),
        arName: this.convertToArabicDigits(yearVal.toString()),
        platform: row ? Number(row.platform) : 0,
        instructor: row ? Number(row.instructor) : 0,
        total: row ? Number(row.platform) + Number(row.instructor) : 0
      };
    });

    const totalPlatform = chart.reduce((sum, c) => sum + c.platform, 0);
    const totalInstructors = chart.reduce((sum, c) => sum + c.instructor, 0);
    const total = chart.reduce((sum, c) => sum + c.total, 0);
    const maxYAxisNumber = Math.ceil(Math.max(...chart.map(c => c.total), 0));

    return {
      chart,
      totalPlatform,
      totalInstructors,
      total,
      transactions,
      maxYAxisNumber
    };
  }

  //##################################### Helpers #####################################

  private getArabicMonthName(index: number): string {
    const monthsAr = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر'
    ];
    return monthsAr[index] || '';
  }

  private getEnglishMonthName(index: number): string {
    const monthsEn = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'June',
      'July',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec'
    ];
    return monthsEn[index] || '';
  }

  // Convert English digits to Arabic digits for year display
  private convertToArabicDigits(num: string): string {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, d => arabicNumbers[+d]);
  }

  // Helper function to translate English issue reasons to Arabic names
  private translateIssue(reason: string): string {
    if (!reason) return 'غير معروف';

    // Normalize: convert to uppercase and replace '-' with '_'
    const normalized = reason.toUpperCase().replace(/-/g, '_');

    const map: Record<string, string> = {
      MISINFORMATION: 'معلومات مضللة',
      HARASSMENT: 'تحرش',
      SPAM: 'بريد عشوائي',
      OFF_TOPIC: 'خارج الموضوع',
      PRIVACY_VIOLATION: 'انتهاك الخصوصية',
      FALSE_CLAIMS: 'ادعاءات كاذبة',
      INAPPROPRIATE_CONTENT: 'محتوى غير لائق'
    };

    return map[normalized] || reason; // fallback to original if not found
  }
}
