import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';
import { IsEnum } from 'class-validator';

export enum LecturerLerningProgramSortEnum {
  UPDATED_AT = 'updatedAt',
  JOINED = 'enrolledUsersCount',
  REVENUE = 'lecturerShare',
  PUBLISHED_AT = '"Diplomas"."publishedAt"'
}

registerEnumType(LecturerLerningProgramSortEnum, {
  name: 'LecturerLerningProgramSortEnum'
});
@InputType()
export class LecturerLerningProgramSortInput {
  @Field(() => LecturerLerningProgramSortEnum, {
    defaultValue: LecturerLerningProgramSortEnum.UPDATED_AT
  })
  @IsEnum(LecturerLerningProgramSortEnum)
  sortBy: LecturerLerningProgramSortEnum;

  @Field(() => SortTypeEnum)
  sortType: SortTypeEnum;
}

@ArgsType()
export class LecturerLerningProgramSortArgs {
  @Field(() => LecturerLerningProgramSortInput, { nullable: true })
  sort?: LecturerLerningProgramSortInput;
}
