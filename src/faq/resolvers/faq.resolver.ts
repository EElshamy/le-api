import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { AuthGuard } from '@src/auth/auth.guard';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { FaqPermissionsEnum } from '@src/security-group/security-group-permissions';
import { FaqForEnum } from '../enums/faq.enum';
import { CreateFaqInput } from '../inputs/create-faq.input';
import { DeleteFaqInput } from '../inputs/delete-faq.input';
import { FaqSortArgs } from '../inputs/faq-sort.input';
import { FaqInput } from '../inputs/faq.input';
import { FaqFilterInputBoard } from '../inputs/faqs-filter-board.input';
import { FaqsFilterInput } from '../inputs/faqs-filter.input';
import { UpdateFaqInput } from '../inputs/update-faq.input';
import { Faq } from '../models/faq.model';
import {
  GqlFaqResponse,
  GqlFaqsArrayResponse,
  GqlFaqsResponse
} from '../response/faq.response';
import { FaqService } from '../services/faq.service';
import { hasDirectives } from '@apollo/client/utilities';
import { UserRoleEnum } from '@src/user/user.enum';

@Resolver(of => Faq)
export class FaqResolver {
  constructor(private readonly faqService: FaqService) {}

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(returns => GqlFaqResponse)
  async createFaqBoard(@Args('input') input: CreateFaqInput) {
    return await this.faqService.createFaqBoard(input);
  }

  @HasPermission(FaqPermissionsEnum.UPDATE_FAQS)
  @UseGuards(AuthGuard)
  @Mutation(returns => GqlFaqResponse)
  async updateFaqBoard(@Args('input') input: UpdateFaqInput) {
    return await this.faqService.updateFaqBoard(input);
  }

  @HasPermission(FaqPermissionsEnum.DELETE_FAQS)
  @UseGuards(AuthGuard)
  @Mutation(returns => GqlBooleanResponse)
  async deleteFaqBoard(@Args() input: DeleteFaqInput) {
    return await this.faqService.deleteFaqBoard(input);
  }

  //** --------------------- QUERIES --------------------- */

  @HasPermission(FaqPermissionsEnum.READ_FAQS)
  @UseGuards(AuthGuard)
  @Query(returns => GqlFaqResponse)
  async faqBoard(@Args() input: FaqInput) {
    return await this.faqService.faqBoard(input);
  }

  @HasPermission(FaqPermissionsEnum.READ_FAQS)
  @UseGuards(AuthGuard)
  @Query(returns => GqlFaqsResponse)
  async faqsBoard(
    @Args() filter: FaqFilterInputBoard,
    @Args() sort: FaqSortArgs,
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.faqService.faqsBoard(
      filter.filter,
      sort.sort,
      paginate.paginate
    );
  }

  @Query(returns => GqlFaqsArrayResponse)
  // @UseGuards(AuthGuard)
  async lecturerFaqs(@Args({ nullable: true }) sort: FaqSortArgs) {
    return await this.faqService.lecuturerOrUserFaqs(
      FaqForEnum.LECTURER,
      sort?.sort
    );
  }

  @Query(returns => GqlFaqsArrayResponse)
  async userFaqs(@Args({ nullable: true }) sort?: FaqSortArgs) {
    return await this.faqService.lecuturerOrUserFaqs(
      FaqForEnum.USER,
      sort?.sort
    );
  }

  @Query(returns => GqlFaqsResponse)
  async faqs(
    @Args() filter: FaqsFilterInput,
    @Args() paginate: NullablePaginatorInput
  ) {
    return await this.faqService.faqs(filter.filter, paginate.paginate);
  }
}
