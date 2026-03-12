import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { Tool } from './models/tool.model';
import { ToolService } from './tool.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { ToolPermissionEnum } from '../../security-group/security-group-permissions';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import {
  GqlToolResponse,
  GqlToolsArrayResponse,
  GqlToolsResponse
} from './tool.response';
import { ToolInput } from './inputs/tool.input';
import { DeleteToolInput } from './inputs/delete-tool.input';
import { UpdateToolInput } from './inputs/update-tool.input';
import {
  BulkCreateToolInput,
  CreateToolInput
} from './inputs/create-tool.input';
import {
  ToolsBoardFilterInput,
  ToolsBoardSortInput
} from './inputs/tools-board.input';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';
import { UserRoleEnum } from '@src/user/user.enum';

@UseGuards(AuthGuard)
@Resolver(() => Tool)
export class ToolResolver {
  constructor(private readonly toolService: ToolService) {}
  //** ---------------------  QUERIES  --------------------- */
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ToolPermissionEnum.READ_TOOL)
  @Query(returns => GqlToolsResponse)
  async toolsBoard(
    @Args() filter: ToolsBoardFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: ToolsBoardSortInput
  ) {
    return await this.toolService.toolsBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ToolPermissionEnum.READ_TOOL)
  @Query(returns => GqlToolResponse)
  async toolBoard(@Args() { toolId }: ToolInput) {
    return await this.toolService.toolOrError(toolId);
  }

  @Query(returns => GqlToolsResponse)
  async activeTools(@Args() paginate: NullablePaginatorInput) {
    return await this.toolService.activeTools(paginate.paginate);
  }

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ToolPermissionEnum.DELETE_TOOL)
  @Mutation(returns => GqlBooleanResponse)
  async deleteToolBoard(@Args('input') input: DeleteToolInput) {
    return await this.toolService.deleteToolBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ToolPermissionEnum.UPDATE_TOOL)
  @Mutation(() => GqlToolResponse)
  async updateToolBoard(@Args('input') input: UpdateToolInput) {
    return await this.toolService.updateToolBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ToolPermissionEnum.CREATE_TOOL)
  @Mutation(() => GqlToolResponse)
  async createToolBoard(@Args('input') input: CreateToolInput) {
    return await this.toolService.createToolBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(ToolPermissionEnum.CREATE_TOOL)
  @Mutation(() => GqlToolsArrayResponse)
  async bulkCreateToolBoard(@Args() input: BulkCreateToolInput) {
    return await this.toolService.bulkCreateToolBoard(input.input);
  }

  //** --------------------- DATALOADER --------------------- */

  @ResolveField(() => Boolean)
  canBeDeleted(
    @Parent() skill: Tool,
    @Context('loaders') loaders: IDataLoaders
  ) {
    return loaders.canToolBeDeletedLoader.load(skill.id);
  }
}
