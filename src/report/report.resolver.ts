import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  generateGqlResponseType,
  GqlBooleanResponse
} from '@src/_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { AuthGuard } from '@src/auth/auth.guard';
import { User } from '@src/user/models/user.model';
import {
  AddReportInput,
  GetReportsFilterInput
} from './interfaces/report-input.interface';
import { ReportSortArgs } from './interfaces/report-sort.input';
import { UpdateReportInput } from './interfaces/update-report.input';
import { ContentReport } from './models/report.model';
import { ReportService } from './report.service';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { UserRoleEnum } from '@src/user/user.enum';
import { ReportPermissionsEnum } from '@src/security-group/security-group-permissions';

//Responses:
const GqlReportResponse = generateGqlResponseType(ContentReport);
const GqlReportsResponse = generateGqlResponseType([ContentReport]);

@Resolver(() => ContentReport)
export class ReportResolver {
  constructor(private readonly reportService: ReportService) {}

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AuthGuard)
  @Mutation(() => GqlReportResponse)
  async addReport(
    @Args('input') input: AddReportInput,
    @CurrentUser() currentUser: User
  ) {
    return await this.reportService.addReport(input, currentUser);
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlReportResponse)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ReportPermissionsEnum.READ_REPORTS)
  async getReportById(
    @Args('reportId') reportId: string,
  ) {
    return await this.reportService.getReportById(reportId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ReportPermissionsEnum.UPDATE_REPORTS)
  @Mutation(() => GqlBooleanResponse)
  async updateReport(@Args('input') input: UpdateReportInput) {
    return await this.reportService.updateReport(input.reportId, input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ReportPermissionsEnum.DELETE_REPORTS)
  @Mutation(() => GqlBooleanResponse)
  async deleteReport(
    @Args('reportId', {
      type: () => Int,
      nullable: false
    })
    reportId: number
  ) {
    return await this.reportService.deleteReport(reportId);
  }

  //** --------------------- QUERIES --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ReportPermissionsEnum.READ_REPORTS)
  @Query(() => GqlReportsResponse)
  async reportsBoard(
    @Args() filter?: GetReportsFilterInput,
    @Args() paginator?: NullablePaginatorInput,
    @Args() sort?: ReportSortArgs
  ) {
    return await this.reportService.reports(
      filter.filter,
      paginator,
      sort.sort
    );
  }
}
