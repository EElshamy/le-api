import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { IDataLoaders } from '../_common/dataloader/dataloader.interface';
import { GqlBooleanResponse } from '../_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '../_common/paginator/paginator.input';
import { AuthGuard } from '../auth/auth.guard';
import { HasPermission, HasRole } from '../auth/auth.metadata';
import {
  FieldOfTrainingPermissionEnum,
  LecturerSpecsPermissionsEnum
} from '../security-group/security-group-permissions';
import { LangEnum, UserRoleEnum } from '../user/user.enum';
import { FieldOfTraining } from './field-of-training.model';
import {
  GqlFieldOfTrainingResponse,
  GqlFieldOfTrainingsResponse
} from './field-of-training.response';
import { FieldOfTrainingService } from './field-of-training.service';
import { CreateFieldOfTrainingBoardInput } from './inputs/create-field-of-training.input';
import {
  FieldOfTrainingsBoardFilterInput,
  FieldOfTrainingsBoardSortInput
} from './inputs/field-of-training-board.input';
import { FieldOfTrainingInput } from './inputs/field-of-training.input';
import { UpdateFieldOfTrainingBoardInput } from './inputs/update-field-of-training.input';

@Resolver(() => FieldOfTraining)
export class FieldOfTrainingResolver {
  constructor(
    private readonly fieldOfTrainingService: FieldOfTrainingService
  ) {}

  //** ---------------------  QUERIES  --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LecturerSpecsPermissionsEnum.READ_LECTURER_SPECS)
  @Query(returns => GqlFieldOfTrainingsResponse)
  async fieldOfTrainingsBoard(
    @Args() filter: FieldOfTrainingsBoardFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: FieldOfTrainingsBoardSortInput
  ) {
    return await this.fieldOfTrainingService.fieldOfTrainingsBoard(
      filter.filter,
      paginate.paginate,
      sort.sort
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(returns => GqlFieldOfTrainingsResponse)
  @HasPermission(LecturerSpecsPermissionsEnum.READ_LECTURER_SPECS)
  async pendingLecturersFieldOfTraining(
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.fieldOfTrainingService.pendingLecturersFieldOfTraining(
      paginate.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Query(returns => GqlFieldOfTrainingResponse)
  @HasPermission(LecturerSpecsPermissionsEnum.READ_LECTURER_SPECS)
  async fieldOfTrainingBoard(@Args() input: FieldOfTrainingInput) {
    return await this.fieldOfTrainingService.fieldOfTrainingOrError(
      input.fieldOfTrainingId
    );
  }

  @Query(returns => GqlFieldOfTrainingsResponse)
  async activeFieldOfTrainings(@Args() paginate: NullablePaginatorInput) {
    return await this.fieldOfTrainingService.fieldOfTrainings(
      paginate.paginate
    );
  }

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(returns => GqlBooleanResponse)
  @HasPermission(LecturerSpecsPermissionsEnum.DELETE_LECTURER_SPECS)
  async deleteFieldOfTraining(
    @Args() { fieldOfTrainingId }: FieldOfTrainingInput
  ) {
    return await this.fieldOfTrainingService.deleteFieldOfTraining(
      fieldOfTrainingId
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlFieldOfTrainingResponse)
  @HasPermission(LecturerSpecsPermissionsEnum.UPDATE_LECTURER_SPECS)
  async updateFieldOfTrainingBoard(
    @Args('input') input: UpdateFieldOfTrainingBoardInput
  ) {
    return await this.fieldOfTrainingService.updateFieldOfTrainingBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlFieldOfTrainingResponse)
  @HasPermission(LecturerSpecsPermissionsEnum.CREATE_LECTURER_SPECS)
  async createFieldOfTrainingBoard(
    @Args('input') input: CreateFieldOfTrainingBoardInput
  ) {
    return await this.fieldOfTrainingService.createFieldOfTrainingBoard(input);
  }

  //** --------------------- DATALOADER --------------------- */

  @ResolveField(type => Boolean)
  canBeDeleted(
    @Parent() fieldOfTraining: FieldOfTraining,
    @Context('loaders') loaders: IDataLoaders
  ) {
    if (fieldOfTraining.timesUsed !== undefined) {
      return +fieldOfTraining.timesUsed === 0;
    }
    return loaders.canFieldOfTrainingBeDeletedLoader.load(fieldOfTraining.id);
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(() => String)
  localizedName(
    @Parent() fieldOfTraining: FieldOfTraining,
    @Context('lang') lang: LangEnum
  ) {
    return (
      fieldOfTraining[`${lang.toLowerCase()}Name`] ?? fieldOfTraining.arName
    );
  }
}
