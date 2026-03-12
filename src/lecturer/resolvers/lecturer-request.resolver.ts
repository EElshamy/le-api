import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { LecturerRequestPermissionsEnum } from '../../security-group/security-group-permissions';
import { User } from '../../user/models/user.model';
import { LecturerRequestInput } from '../inputs/lecturer-request.input';
import {
  LecturerRequestsBoardFilterInput,
  LecturerRequestsBoardSortInput
} from '../inputs/lecturer-requests-board.input';
import { ReplyLecturerJoinRequestInput } from '../inputs/reply-lecturer-request.input';
import { UpdateLecturerRequestBoardInput } from '../inputs/update-lecturer-request.input';
import { LecturerRequest } from '../models/lecturer.request.model';
import {
  GqLecturerRequestResponse,
  GqLecturerRequestsResponse,
  GqlYearsOfExperienceRangeResponse
} from '../responses/lecturer-request.response';
import { LecturerRequestService } from '../services/lecturer-request.service';
import { UserRoleEnum } from '@src/user/user.enum';

@UseGuards(AuthGuard)
@Resolver(() => LecturerRequest)
export class LecturerRequestResolver {
  constructor(private readonly lecturerRequestService: LecturerRequestService) {}
  //** --------------------- QUERIES --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerRequestPermissionsEnum.READ_LECTURER_REQUEST)
  @Query(returns => GqLecturerRequestsResponse)
  async lecturerRequestsBoard(
    @Args() paginateInput: NullablePaginatorInput,
    @Args() filter: LecturerRequestsBoardFilterInput,
    @Args() sort: LecturerRequestsBoardSortInput
  ) {
    return await this.lecturerRequestService.lecturerRequestsBoard(
      paginateInput.paginate,
      filter.filter,
      sort.sort
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerRequestPermissionsEnum.READ_LECTURER_REQUEST)
  @Query(returns => GqLecturerRequestResponse)
  async lecturerRequestBoard(@Args() input: LecturerRequestInput) {
    return await this.lecturerRequestService.lecturerRequestByLecturerCode(input.lecturerCode);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerRequestPermissionsEnum.READ_LECTURER_REQUEST)
  @Query(returns => GqlYearsOfExperienceRangeResponse)
  async findLecturersYearsOfExperience() {
    return await this.lecturerRequestService.findLecturersYearsOfExperience();
  }

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerRequestPermissionsEnum.UPDATE_LECTURER_REQUEST)
  @Mutation(returns => GqLecturerRequestResponse)
  async replyLecturerJoinRequestBoard(@Args('input') input: ReplyLecturerJoinRequestInput) {
    return await this.lecturerRequestService.replyLecturerJoinRequest(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerRequestPermissionsEnum.DELETE_LECTURER_REQUEST)
  @Mutation(returns => GqlBooleanResponse)
  async deleteLecturerRequest(@Args('lecturerId') lecturerId: string) {
    return await this.lecturerRequestService.deleteLecturerRequest(lecturerId);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerRequestPermissionsEnum.UPDATE_LECTURER_REQUEST)
  @Mutation(returns => GqLecturerRequestResponse)
  async updateLecturerRequestBoard(@Args('input') input: UpdateLecturerRequestBoardInput) {
    return await this.lecturerRequestService.updateLecturerRequest(input);
  }

  //** --------------------- DATALOADER --------------------- */

  @ResolveField(type => User)
  user(@Parent() lecturerRequest: LecturerRequest, @Context('loaders') loaders: IDataLoaders) {
    return loaders.userByLecturerIdLoader.load(lecturerRequest.lecturerId);
  }
}
