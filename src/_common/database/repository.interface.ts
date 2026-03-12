import {
  FindAttributeOptions,
  GroupOption,
  Includeable,
  Optional,
  Order,
  Transaction,
  WhereOptions
} from 'sequelize/types';
import { PaginationRes } from '../paginator/paginator.types';

export interface IRepository<T> {
  findOne(
    where: WhereOptions<T>,
    include?: Includeable[],
    sort?: Order,
    attributes?: string[],
    transaction?: Transaction
  ): Promise<T>;

  findAll(
    where?: WhereOptions<T>,
    include?: Includeable[],
    sort?: Order | string,
    attributes?: FindAttributeOptions,
    group?: GroupOption,
    transaction?: Transaction,
    distinct?: boolean
  ): Promise<T[]>;

  findPaginated(
    where: WhereOptions<T>,
    sort: any,
    page: number,
    limit: number,
    include?: Includeable[],
    attributes?: FindAttributeOptions,
    isNestAndRaw?: boolean,
    subQuery?: boolean,
    group?: GroupOption,
    distinct?: boolean
  ): Promise<PaginationRes<T>>;

  findPaginatedManually(
    items: T[],
    page: number,
    limit: number
  ): PaginationRes<T>;

  sumField(
    field: keyof T,
    where: WhereOptions<T>,
    transaction?: Transaction
  ): Promise<number>;

  createOne(input: Optional<T, keyof T>, transaction?: Transaction): Promise<T>;

  bulkCreate(
    items: Array<Optional<T, keyof T>>,
    transaction?: Transaction,
    updateOnDuplicate?: string[]
  ): Promise<T[]>;

  findOrCreate(
    where: WhereOptions<T>,
    input: Optional<T, keyof T>,
    transaction?: Transaction
  ): Promise<T>;

  updateOneFromExistingModel(
    model: T,
    input: Optional<T, keyof T>,
    transaction?: Transaction
  ): Promise<T>;

  updateAll(
    where: WhereOptions<T>,
    input: Optional<T, keyof T>,
    transaction?: Transaction
  ): Promise<T[]>;

  updateOne(
    where: WhereOptions<T>,
    input: Optional<T, keyof T>,
    transaction?: Transaction
  ): Promise<T>;

  deleteAll(where: WhereOptions<T>, transaction?: Transaction): Promise<number>;

  deleteOne(where: WhereOptions<T>, transaction?: Transaction): Promise<number>;

  truncateModel(): Promise<void>;

  rawDelete(): Promise<void>;

  rawQuery<T>(sql: string): Promise<T>;

  countGroupedBy(
    where: WhereOptions,
    groupBy: keyof T,
    alias: string,
    include?: Includeable[]
  ): Promise<any>;
}
