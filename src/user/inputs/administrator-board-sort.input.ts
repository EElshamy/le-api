import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { administratorSortEnum, UserSortEnum } from '../user.enum';

@InputType()
export class administratorBoardSort {
  @Field(() => administratorSortEnum)
  sortBy: UserSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class nullableAdministratorBoardSort {
  @Field({ nullable: true })
  sort: administratorBoardSort;
}
