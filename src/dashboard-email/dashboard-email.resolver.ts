import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DashboardEmailService } from './dashboard-email.service';
import { DashboardEmail } from './models/dashboard-email.entity';
import { CreateDashboardEmailInput } from './dto/create-dashboard-email.input';
import { UpdateDashboardEmailInput } from './dto/update-dashboard-email.input';
import {
  GqlBooleanResponse,
  GqlStringResponse
} from '@src/_common/graphql/graphql-response.type';
import {
  GqlDashboardEmailResponse,
  GqlDashboardEmailsResponse
} from './outputs/dashboard-emails.response';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';
import { UserRoleEnum } from '@src/user/user.enum';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  DashBoardEmailsFilterArgs,
  DashboardEmailSortInput
} from './types/dashboard-email.type';
import { EmailsPermissionsEnum } from '@src/security-group/security-group-permissions';

@Resolver(() => DashboardEmail)
export class DashboardEmailResolver {
  constructor(private readonly dashboardEmailService: DashboardEmailService) {}

  //################################### MUTATIONS ###################################
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(EmailsPermissionsEnum.CREATE_EMAILS)
  @Mutation(() => GqlDashboardEmailResponse)
  async createDashboardEmail(
    @Args('input')
    input: CreateDashboardEmailInput
  ) {
    return await this.dashboardEmailService.createDashboardEmail(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(EmailsPermissionsEnum.CREATE_EMAILS)
  @Mutation(() => GqlDashboardEmailResponse)
  async sendDashboardEmail(@Args('id', { type: () => String }) id: string) {
    return await this.dashboardEmailService.sendDashboardEmail(id);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(EmailsPermissionsEnum.UPDATE_EMAILS)
  @Mutation(() => GqlDashboardEmailResponse)
  async updateDashboardEmail(
    @Args('input')
    input: UpdateDashboardEmailInput
  ) {
    return await this.dashboardEmailService.updateDashboardEmail(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(EmailsPermissionsEnum.DELETE_EMAILS)
  @Mutation(() => GqlBooleanResponse)
  async deleteDashboardEmail(@Args('id', { type: () => String }) id: string) {
    return await this.dashboardEmailService.deleteDashboardEmail(id);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlStringResponse)
  async exportDashboardEmails(
    @Args('id', { type: () => String, nullable: true }) id: string
  ): Promise<string> {
    return await this.dashboardEmailService.exportDashboardEmails(id);
  }

  //################################### QUERIES ###################################
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(EmailsPermissionsEnum.READ_EMAILS)
  @Query(() => GqlDashboardEmailsResponse)
  async dashboardEmails(
    @Args({ nullable: true }) { filter }: DashBoardEmailsFilterArgs,
    @Args({ nullable: true }) { sort }: DashboardEmailSortInput,
    @Args({ nullable: true }) { paginate }: NullablePaginatorInput
  ) {
    return await this.dashboardEmailService.findAll(filter, sort, paginate);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(EmailsPermissionsEnum.READ_EMAILS)
  @Query(() => GqlDashboardEmailResponse)
  async singleDashboardEmail(@Args('id', { type: () => String }) id: string) {
    return await this.dashboardEmailService.emailExistOrError(id);
  }
}
