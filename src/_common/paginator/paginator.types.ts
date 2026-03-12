import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { WhereOptions, Includeable, FindAttributeOptions } from 'sequelize/types';
import { MyModelStatic } from '../database/database.static-model';

export enum CursorBasedPaginationDirection {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER'
}
registerEnumType(CursorBasedPaginationDirection, { name: 'CursorBasedPaginationDirection' });

export enum CursorBasedSortType {
  ASC = 'ASC',
  DESC = 'DESC'
}
registerEnumType(CursorBasedSortType, { name: 'CursorBasedSortType' });

export enum SortTypeEnum {
  ASC = 'ASC',
  DESC = 'DESC'
}
registerEnumType(SortTypeEnum, { name: 'SortTypeEnum' });

export interface IPaginatedFilter {
  where?: WhereOptions;
  sort?: string;
  page?: number;
  limit?: number;
  include?: Includeable[];
}

export interface ICursorPaginatedFilter {
  where?: WhereOptions;
  cursor?: string;
  limit?: number;
  direction?: CursorBasedPaginationDirection;
  include?: Includeable[];
}

export interface PaginationRes<T> {
  items: T[];
  pageInfo: {
    page?: number;
    limit?: number;
    nextCursor?: string;
    beforeCursor?: string;
    hasNext: boolean;
    hasBefore: boolean;
    totalCount?: number;
    totalPages?: number;
    direction?: CursorBasedPaginationDirection;
  };
}
@ObjectType()
export abstract class PageInfo {
  @Field(type => Int, { nullable: true })
  page?: number;

  @Field(type => Int, { nullable: true })
  limit?: number;

  @Field({ nullable: true })
  nextCursor?: string;

  @Field({ nullable: true })
  beforeCursor?: string;

  @Field(type => Boolean)
  hasNext: boolean;

  @Field(type => Boolean)
  hasBefore: boolean;

  @Field({ nullable: true })
  totalCount?: number;

  @Field({ nullable: true })
  totalPages?: number;

  @Field(() => CursorBasedPaginationDirection, { nullable: true })
  direction?: CursorBasedPaginationDirection;
}

export interface CursorBasedPaginationArgsType {
  sortBy?: string;
  attributes: FindAttributeOptions;
  model: MyModelStatic;
  filter: object;
  cursor: string;
  limit: number;
  direction: CursorBasedPaginationDirection;
  include: Includeable[];
  sort: CursorBasedSortType;
}
