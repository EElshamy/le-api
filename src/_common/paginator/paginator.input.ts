import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, Min, ValidateNested } from 'class-validator';
import { CursorBasedPaginationDirection } from './paginator.types';

@InputType()
export class CursorBasedPaginatorInput {
  @Field({ nullable: true })
  cursor?: string;

  @Field(() => CursorBasedPaginationDirection, { nullable: true })
  direction?: CursorBasedPaginationDirection;

  @Min(1)
  @Field({ defaultValue: 15 })
  limit?: number;
}

@ArgsType()
export class NullableCursorBasedPaginatorInput {
  @Field({ nullable: true })
  @IsOptional()
  @ValidateNested()
  paginate?: CursorBasedPaginatorInput;
}

@InputType()
export class PaginatorInput {
  @Min(1)
  @Field({ defaultValue: 1 , nullable: true })
  page?: number;

  @Min(1)
  @Field({ defaultValue: 15 , nullable: true })
  limit?: number;
}

@ArgsType()
export class NullablePaginatorInput {
  @Field({ nullable: true })
  @IsOptional()
  @ValidateNested()
  paginate?: PaginatorInput;
}
