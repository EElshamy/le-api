import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { IsOptional } from "class-validator";
import { DiplomaProgramsSortEnum, DiplomaSortEnum, UsersSortEnum } from "../enums/diploma-status.enum";
import { SortTypeEnum } from "@src/_common/paginator/paginator.types";

@InputType()
export class DiplomaSortInput {
  @IsOptional()
  @Field(() => DiplomaSortEnum , { nullable: true })
  sortBy?: DiplomaSortEnum;

  @IsOptional()
  @Field(() => SortTypeEnum , { nullable: true })
  sortType?: SortTypeEnum;
}

@InputType()
export class ProgramsSortInput {
  @IsOptional()
  @Field(() => DiplomaProgramsSortEnum , { nullable: true })
  sortBy?: DiplomaProgramsSortEnum;

  @IsOptional()
  @Field(() => SortTypeEnum , { nullable: true })
  sortType?: SortTypeEnum;
}

registerEnumType(DiplomaProgramsSortEnum, { name: 'DiplomaProgramsSortEnum' });

@InputType()
export class UsersSortInput {
  @IsOptional()
  @Field(() => UsersSortEnum , { nullable: true })
  sortBy?: UsersSortEnum;

  @IsOptional()
  @Field(() => SortTypeEnum , { nullable: true })
  sortType?: SortTypeEnum;
}