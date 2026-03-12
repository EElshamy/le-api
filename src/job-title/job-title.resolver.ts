import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { JobTitle } from './job-title.model';
import { JobTitleService } from './job-title.service';
import {
  GqlJobTitleResponse,
  GqlJobTitlesResponse
} from './job-title.response';
import { UseGuards } from '@nestjs/common';
import { NullablePaginatorInput } from '../_common/paginator/paginator.input';
import { AuthGuard } from '../auth/auth.guard';
import {
  JobTitlesBoardFilterInput,
  JobTitlesBoardSortInput
} from './inputs/job-titles-board.input';
import { JobTitleInput } from './inputs/job-title.input';
import { CreateJobTitleBoardInput } from './inputs/create-job-title.input';
import { UpdateJobTitleBoardInput } from './inputs/update-job-title.input';
import { GqlBooleanResponse } from '../_common/graphql/graphql-response.type';
import { IDataLoaders } from '../_common/dataloader/dataloader.interface';
import { LangEnum, UserRoleEnum } from '../user/user.enum';
import {
  JobTitlePermissionEnum,
  LecturerSpecsPermissionsEnum
} from '../security-group/security-group-permissions';
import { HasPermission, HasRole } from '../auth/auth.metadata';

@Resolver(() => JobTitle)
export class JobTitleResolver {
  constructor(private readonly jobTitleService: JobTitleService) {}

  //** ---------------------  QUERIES  --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerSpecsPermissionsEnum.READ_LECTURER_SPECS)
  @Query(returns => GqlJobTitlesResponse)
  async jobTitlesBoard(
    @Args() filter: JobTitlesBoardFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: JobTitlesBoardSortInput
  ) {
    return await this.jobTitleService.jobTitlesBoard(
      filter.filter,
      paginate.paginate,
      sort.sort
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerSpecsPermissionsEnum.READ_LECTURER_SPECS)
  @Query(returns => GqlJobTitleResponse)
  async jobTitleBoard(@Args() input: JobTitleInput) {
    return await this.jobTitleService.jobTitleOrError(input.jobTitleId);
  }

  @Query(returns => GqlJobTitlesResponse)
  async activeJobTitles(@Args() paginate: NullablePaginatorInput) {
    return await this.jobTitleService.jobTitles(paginate.paginate);
  }

  //** --------------------- MUTATIONS --------------------- */

  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerSpecsPermissionsEnum.DELETE_LECTURER_SPECS)
  @UseGuards(AuthGuard)
  @Mutation(returns => GqlBooleanResponse)
  async deleteJobTitle(@Args() { jobTitleId }: JobTitleInput) {
    return await this.jobTitleService.deleteJobTitle(jobTitleId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlJobTitleResponse)
  @HasPermission(LecturerSpecsPermissionsEnum.UPDATE_LECTURER_SPECS)
  async updateJobTitleBoard(@Args('input') input: UpdateJobTitleBoardInput) {
    return await this.jobTitleService.updateJobTitleBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlJobTitleResponse)
  @HasPermission(LecturerSpecsPermissionsEnum.CREATE_LECTURER_SPECS)
  async createJobTitleBoard(@Args('input') input: CreateJobTitleBoardInput) {
    return await this.jobTitleService.createJobTitleBoard(input);
  }

  //** --------------------- DATALOADER --------------------- */

  @ResolveField(type => Boolean)
  canBeDeleted(@Parent() jobTitle, @Context('loaders') loaders: IDataLoaders) {
    if (jobTitle.timesUsed !== undefined) {
      return +jobTitle.timesUsed === 0;
    }
    return loaders.canJobTitleBeDeletedLoader.load(jobTitle.id);
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(() => String)
  localizedName(@Parent() jobTitle: JobTitle, @Context('lang') lang: LangEnum) {
    return jobTitle[`${lang.toLowerCase()}Name`] ?? jobTitle.arName;
  }

  @ResolveField(() => Int, { defaultValue: 0 })
  timesUsed(@Parent() jobTitle: JobTitle) {
    return this.jobTitleService.timeUsed(jobTitle.id);
  }
}
