import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { HelperService } from '@src/_common/utils/helper.service';
import { CodePrefix } from '@src/_common/utils/helpers.enum';
import { Blog } from '@src/blogs/blog/models/blog.model';
import { Comment } from '@src/comment/models/comment.model';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { Review } from '@src/reviews/review.model';
import { User } from '@src/user/models/user.model';
import { UserRoleEnum } from '@src/user/user.enum';
import { Op } from 'sequelize';
import { ReportTargetEnum } from './enums/report-targets.enum';
import { ReporterTypeEnum } from './enums/reporter-type.enum';
import {
  AddReportInput,
  GetReportsFilter
} from './interfaces/report-input.interface';
import { ReportSortInput } from './interfaces/report-sort.input';
import { UpdateReportInput } from './interfaces/update-report.input';
import { ContentReport } from './models/report.model';

@Injectable()
export class ReportService {
  constructor(
    @Inject(Repositories.ContentReportsRepository)
    private readonly reportRepo: IRepository<ContentReport>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.BlogsRepository)
    private readonly blogRepo: IRepository<Blog>,
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewRepo: IRepository<Review>,
    @Inject(Repositories.CommentsRepository)
    private readonly commentRepo: IRepository<Comment>,
    private readonly helperService: HelperService
  ) {}

  async getReportById(id: string): Promise<ContentReport> {
    return this.reportRepo.findOne({ id });
  }

  async addReport(
    input: AddReportInput,
    currentUser: User
  ): Promise<ContentReport> {
    let report: ContentReport;
    if (!currentUser) {
      report = await this.reportRepo.findOne({
        email: input.email,
        targetId: input.targetId,
        targetType: input.targetType
      });
    } else {
      report = await this.reportRepo.findOne({
        userId: currentUser.id,
        targetId: input.targetId,
        targetType: input.targetType
      });
    }
    if (report)
      throw new BaseHttpException(ErrorCodeEnum.REPORT_ALREADY_EXISTS);

    const userType = this.getReporterType(currentUser);
    const { email, fullname } = this.getReporterDetails(input, currentUser);

    // Validate Target Exists
    const targetRepository = this.getTargetRepository(input.targetType);
    const target = await targetRepository.findOne({ id: input.targetId });
    if (!target) throw new BaseHttpException(ErrorCodeEnum.TARGET_NOT_FOUND);
    if (
      (input.targetType === ReportTargetEnum.COMMENT ||
        input.targetType === ReportTargetEnum.REVIEW) &&
      target?.['userId'] === currentUser?.id
    )
      throw new BaseHttpException(ErrorCodeEnum.REPORT_SELF);

    // Create Report
    return this.reportRepo.createOne({
      ...input,
      userId: currentUser?.id,
      reporterType: userType,
      email,
      fullname,
      code: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.REPORT,
        this.reportRepo
      )
    });
  }

  // ** Determine reporter type based on user role. ** //
  private getReporterType(user?: User): ReporterTypeEnum {
    if (!user) return ReporterTypeEnum.GUEST;
    if (user.role === UserRoleEnum.LECTURER) return ReporterTypeEnum.LECTURER;
    if (user.role === UserRoleEnum.USER) return ReporterTypeEnum.USER;
    return ReporterTypeEnum.GUEST;
  }

  // ** Extracts reporter email and fullname, ensuring required fields for guests ** //
  private getReporterDetails(
    input: AddReportInput,
    user?: User
  ): {
    email: string;
    fullname: string;
  } {
    if (user) return { email: user.email, fullname: user.enFullName };

    if (!input.email || !input.fullname) {
      throw new BaseHttpException(
        ErrorCodeEnum.REPORT_EMAIL_AND_FULLNAME_REQUIRED
      );
    }

    return { email: input.email, fullname: input.fullname };
  }

  private getTargetRepository(targetType: ReportTargetEnum): IRepository<any> {
    switch (targetType) {
      case ReportTargetEnum.COURSE:
        return this.courseRepo;
      case ReportTargetEnum.WORKSHOP:
        return this.courseRepo;
      case ReportTargetEnum.DIPLOMA:
        return this.diplomaRepo;
      case ReportTargetEnum.LECTURER:
        return this.lecturerRepo;
      case ReportTargetEnum.BLOG:
        return this.blogRepo;
      case ReportTargetEnum.REVIEW:
        return this.reviewRepo;
      case ReportTargetEnum.COMMENT:
        return this.commentRepo;
      default:
        throw new Error('Invalid target type');
    }
  }

  async updateReport(
    reportId: number,
    input: UpdateReportInput
  ): Promise<boolean> {
    const report = await this.reportRepo.findOne({ id: reportId });

    if (!report) {
      throw new BaseHttpException(ErrorCodeEnum.REPORT_NOT_FOUND);
    }

    return !!(await this.reportRepo.updateOneFromExistingModel(report, input));
  }

  async deleteReport(reportId: number): Promise<boolean> {
    const report = await this.reportRepo.findOne({
      id: reportId
    });

    if (!report) {
      throw new BaseHttpException(ErrorCodeEnum.REPORT_NOT_FOUND);
    }

    return !!(await this.reportRepo.deleteAll({ id: reportId }));
  }

  async report(userId: string, targetId: string): Promise<ContentReport> {
    const report = await this.reportRepo.findOne({
      userId,
      targetId
    });

    return report;
  }

  async reports(
    filter: GetReportsFilter,
    paginator?: NullablePaginatorInput,
    sort?: ReportSortInput
  ): Promise<PaginationRes<ContentReport>> {
    const reports = await this.reportRepo.findPaginated(
      {
        ...(filter?.targetType && { targetType: filter.targetType }),
        ...(filter?.reason && { reason: filter.reason }),
        ...(filter?.reporterType && { reporterType: filter.reporterType }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.searchKey && {
          [Op.or]: [
            { email: { [Op.iLike]: `%${filter.searchKey}%` } },
            { fullname: { [Op.iLike]: `%${filter.searchKey}%` } },
            { code: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        })
      },
      [[sort?.sortBy || 'createdAt', sort?.sortType || SortTypeEnum.DESC]],
      paginator?.paginate?.page || 1,
      paginator?.paginate?.limit || 15,
      [
        {
          model: User,
          as: 'user'
        }
      ]
    );
    return reports;
  }
}
