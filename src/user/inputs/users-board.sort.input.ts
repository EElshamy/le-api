import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { UserSortEnum } from '../user.enum';

@InputType()
export class UsersBoardSort {
  @Field(() => UserSortEnum)
  sortBy: UserSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class UsersBoardSortInput {
  @Field({ nullable: true })
  sort: UsersBoardSort;
}
