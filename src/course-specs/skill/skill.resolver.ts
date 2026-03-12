import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { Skill } from './models/skill.model';
import { SkillService } from './skill.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { HasPermission, HasRole } from '../../auth/auth.metadata';
import { SkillPermissionEnum } from '../../security-group/security-group-permissions';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import {
  GqlSkillResponse,
  GqlSkillsResponse,
  GqlSkillsArrayResponse
} from './skill.response';
import { SkillInput } from './inputs/skill.input';
import { DeleteSkillInput } from './inputs/delete-skill.input';
import { UpdateSkillInput } from './inputs/update-skill.input';
import {
  BulkCreateSkillInput,
  CreateSkillInput
} from './inputs/create-skill.input';
import {
  SkillsBoardFilterInput,
  SkillsBoardSortInput
} from './inputs/skills-board.input';
import { NullablePaginatorInput } from '../../_common/paginator/paginator.input';
import { LangEnum, UserRoleEnum } from '../../user/user.enum';
import { IDataLoaders } from '../../_common/dataloader/dataloader.interface';

@UseGuards(AuthGuard)
@Resolver(() => Skill)
export class SkillResolver {
  constructor(private readonly skillService: SkillService) {}
  //** ---------------------  QUERIES  --------------------- */
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SkillPermissionEnum.READ_SKILL)
  @Query(returns => GqlSkillsResponse)
  async skillsBoard(
    @Args() filter: SkillsBoardFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: SkillsBoardSortInput
  ) {
    return await this.skillService.skillsBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SkillPermissionEnum.READ_SKILL)
  @Query(returns => GqlSkillResponse)
  async skillBoard(@Args() { skillId }: SkillInput) {
    return await this.skillService.skillOrError(skillId);
  }

  @Query(returns => GqlSkillsResponse)
  async activeSkills(@Args() paginate: NullablePaginatorInput) {
    return await this.skillService.activeSkills(paginate.paginate);
  }

  //** --------------------- MUTATIONS --------------------- */
  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SkillPermissionEnum.DELETE_SKILL)
  @Mutation(returns => GqlBooleanResponse)
  async deleteSkillBoard(@Args('input') input: DeleteSkillInput) {
    return await this.skillService.deleteSkillBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SkillPermissionEnum.UPDATE_SKILL)
  @Mutation(() => GqlSkillResponse)
  async updateSkillBoard(@Args('input') input: UpdateSkillInput) {
    return await this.skillService.updateSkillBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SkillPermissionEnum.CREATE_SKILL)
  @Mutation(() => GqlSkillResponse)
  async createSkillBoard(@Args('input') input: CreateSkillInput) {
    return await this.skillService.createSkillBoard(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SkillPermissionEnum.CREATE_SKILL)
  @Mutation(() => GqlSkillsArrayResponse)
  async bulkCreateSkillBoard(@Args() input: BulkCreateSkillInput) {
    return await this.skillService.bulkCreateSkillBoard(input.input);
  }

  //** ------------------ RESOLVE FIELDS ------------------ */

  @ResolveField(() => String)
  localizedName(@Parent() skill: Skill, @Context('lang') lang: LangEnum) {
    return skill[`${lang.toLowerCase()}Name`] ?? skill.arName;
  }
  @ResolveField(() => Boolean)
  canBeDeleted(
    @Parent() skill: Skill,
    @Context('loaders') loaders: IDataLoaders
  ) {
    return loaders.canSkillBeDeletedLoader.load(skill.id);
  }
}
