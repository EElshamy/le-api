import {
  Args,
  Context,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { LangEnum, UserRoleEnum } from '@src/user/user.enum';
import { AuthGuard } from '@src/auth/auth.guard';
import { UseGuards } from '@nestjs/common';
import {
  GqlFinancialAnalyticsResponse,
  GqlInstructorsAnalyticsResponse,
  GqlLearnersInsightsAnalyticsResponse,
  GqlLearningProgramRevenueAnalyticsResponse,
  GqlLearningProgramsAnalyticsResponse,
  GqlPlatformGrowthAnalyticsResponse,
  GqlSupportAndFeedbackAnalyticsResponse
} from './analytics.response';
import { AnalyticsPermissionsEnum } from '@src/security-group/security-group-permissions';
@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  //############################## Financial Analytics ##############################

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(AnalyticsPermissionsEnum.READ_ANALYTICS)
  @Query(() => GqlFinancialAnalyticsResponse)
  async getFinancialAnalytics(
    @Args('year', { nullable: true, type: () => Int }) year?: number
  ) {
    return await this.analyticsService.getFinancialAnalytics(year);
  }

  //############################## Platform Growth & Engagement ##############################

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(AnalyticsPermissionsEnum.READ_ANALYTICS)
  @Query(() => GqlPlatformGrowthAnalyticsResponse)
  async getPlatformGrowthAnalytics(
    @Args('year', { nullable: true, type: () => Int }) year?: number
  ) {
    return await this.analyticsService.getPlatformGrowthAnalytics(year);
  }

  //############################## Learning Programs Analytics ##############################

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(AnalyticsPermissionsEnum.READ_ANALYTICS)
  @Query(() => GqlLearningProgramsAnalyticsResponse)
  async getLearningProgramsAnalytics(
    @Args('year', { nullable: true, type: () => Int }) year?: number
  ) {
    return await this.analyticsService.getLearningProgramsAnalytics(year);
  }

  //##################################### Instructors Management #####################################

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(AnalyticsPermissionsEnum.READ_ANALYTICS)
  @Query(() => GqlInstructorsAnalyticsResponse)
  async InstructorsAnalytics(
    @Args('year', { nullable: true, type: () => Int }) year?: number
  ) {
    return await this.analyticsService.getInstructorsAnalytics(year);
  }

  //##################################### Learner Insights #####################################

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(AnalyticsPermissionsEnum.READ_ANALYTICS)
  @Query(() => GqlLearnersInsightsAnalyticsResponse)
  async learnersInsightsAnalytics(
    @Args('year', { nullable: true, type: () => Int }) year?: number
  ) {
    return await this.analyticsService.getLearnersInsightsAnalytics(year);
  }

  //##################################### Support & Feedback #####################################

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(AnalyticsPermissionsEnum.READ_ANALYTICS)
  @Query(() => GqlSupportAndFeedbackAnalyticsResponse)
  async supportAndFeedbackAnalytics(
    @Args('year', { nullable: true, type: () => Int }) year?: number
  ) {
    return await this.analyticsService.supportAndFeedbackAnalytics(year);
  }

  //##################################### learningProgram Revenue #####################################

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(AnalyticsPermissionsEnum.READ_ANALYTICS)
  @Query(() => GqlLearningProgramRevenueAnalyticsResponse)
  async getlearningProgramRevenueAnalytics(
    @Args('programId', { type: () => String }) courseId: string,
    @Args('year', { nullable: true, type: () => Int }) year?: number
  ) {
    return await this.analyticsService.getlearningProgramRevenueAnalytics(
      courseId,
      year
    );
  }
}
