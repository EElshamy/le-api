import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { SearchSortInput } from '@src/course/inputs/search.types';
import { GeneralSearchFilterInput } from './inputs/search.input';
import {
  GqlSearchResultsPaginatedResponse,
  GqlSearchResultsResponse
} from './interfaces/responses.interface';
import { SearchResult } from './interfaces/search-result.interface';
import { GqlAllSearchResultResponse } from './response/all-search.response';
import { SearchService } from './search.service';
import { SearchKeyword } from './entities/saerch-keyword.model';
import { CreateSearchKeywordInput } from './inputs/create-search-keyword.input';
import { UpdateSearchKeywordInput } from './inputs/update-search-keyword.input';
import {
  GqlAllSearchKeywordResponse,
  GqlAllSearchKeywordsResponse
} from './response/all-search-keywords.response';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';
import { UserRoleEnum } from '@src/user/user.enum';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { SearchKeywordPermissionEnum } from '@src/security-group/security-group-permissions';

@Resolver(() => SearchResult)
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  // --------------------------------------------- Queries ---------------------------------------------

  // @UseGuards(AuthGuard)
  @Query(() => GqlSearchResultsPaginatedResponse)
  async search(
    @Args() filter: GeneralSearchFilterInput,
    @Args() paginate: NullablePaginatorInput,
    @Args() sort: SearchSortInput
  ) {
    return await this.searchService.search(filter.filter, paginate, sort);
  }

  // @UseGuards(AuthGuard)
  @Query(() => GqlSearchResultsResponse)
  async searchSuggestions(@Args() filter: GeneralSearchFilterInput) {
    return await this.searchService.searchSuggestions(filter.filter, 10);
  }

  @Query(() => GqlAllSearchResultResponse)
  async allSearch(
    @Args() filter: GeneralSearchFilterInput,
    @Args() sort: SearchSortInput
  ) {
    return await this.searchService.allSearch(filter.filter, sort.sort);
  }

  @Query(() => GqlAllSearchKeywordsResponse)
  async searchKeywords() {
    return this.searchService.searchKeywords();
  }

  // --------------------------------------------- Mutations ---------------------------------------------

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SearchKeywordPermissionEnum.CREATE_SEARCH_KEYWORD)
  @Mutation(() => GqlAllSearchKeywordResponse)
  async createSearchKeyword(@Args('input') input: CreateSearchKeywordInput) {
    return this.searchService.createSearchKeyword(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SearchKeywordPermissionEnum.UPDATE_SEARCH_KEYWORD)
  @Mutation(() => GqlAllSearchKeywordResponse)
  async updateSearchKeyword(@Args('input') input: UpdateSearchKeywordInput) {
    return await this.searchService.updateSearchKeyword(input.id, input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(SearchKeywordPermissionEnum.DELETE_SEARCH_KEYWORD)
  @Mutation(() => GqlBooleanResponse)
  async deleteSearchKeyword(@Args('id') id: string) {
    await this.searchService.deleteSearchKeyword(id);
    return true;
  }
}
