import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsEnum } from 'class-validator';

export enum UserLearningProgramSortEnum {
  joinedAt = 'createdAt'
  //   PAID = 'paid'
}

registerEnumType(UserLearningProgramSortEnum, {
  name: 'UserLearningProgramSortEnum'
});
@InputType()
export class UserLearningProgramSortInput {
  @Field(() => UserLearningProgramSortEnum)
  @IsEnum(UserLearningProgramSortEnum)
  sortBy: UserLearningProgramSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class UserLearningProgramSortArgs {
  @Field(() => UserLearningProgramSortInput, { nullable: true })
  sort?: UserLearningProgramSortInput;
}
