import { Global, Injectable } from '@nestjs/common';
import {
  MyModel,
  MyModelStatic
} from '@src/_common/database/database.static-model';
import {
  FindAttributeOptions,
  GroupOption,
  Includeable,
  Model,
  Order,
  Sequelize,
  Transaction,
  WhereOptions
} from 'sequelize';
import { PaginationRes } from '../paginator/paginator.types';
import { IRepository } from './repository.interface';

export function buildRepository(Model: MyModelStatic): any {
  @Global()
  @Injectable()
  class DatabaseRepositoryBuilder implements IRepository<MyModel> {
    async findOne(
      where: WhereOptions = {},
      include: Includeable[] = [],
      sort?: Order,
      attributes?: string[],
      transaction?: Transaction
    ): Promise<MyModel> {
      return await Model.findOne({
        where,
        include,
        order: sort,
        ...(attributes && { attributes }),
        ...(transaction && { transaction })
      });
    }

    async findAll(
      where: WhereOptions = {},
      include: Includeable[] = [],
      sort = '-createdAt',
      attributes?: FindAttributeOptions,
      group?: GroupOption,
      transaction?: Transaction
    ): Promise<MyModel[]> {
      if (!sort) sort = '-createdAt';
      let order = null;
      // Literal query
      if (typeof sort === 'object') order = sort;
      else
        order = [
          [sort.replace('-', ''), sort.startsWith('-') ? 'DESC' : 'ASC']
        ];
      const res = await Model.findAll({
        where,
        include,
        ...(order && { order }),
        ...(attributes && { attributes }),
        ...(group && { group }),
        ...(transaction && { transaction })
      });

      return res;
    }

    async findPaginated(
      where: WhereOptions = {},
      sort: any = '-createdAt',
      page: number = 0,
      limit: number = 15,
      include: Includeable[] = [],
      attributes: any = null,
      isNestAndRaw: boolean = true,
      subQuery: boolean = false,
      group?: GroupOption,
      distinct?: boolean
    ): Promise<PaginationRes<MyModel>> {
      return await (Model as MyModelStatic & { paginate: any }).paginate(
        where,
        sort,
        page,
        limit,
        include,
        attributes,
        isNestAndRaw,
        subQuery,
        group,
        distinct
      );
    }

    findPaginatedManually(
      items: MyModel[],
      page: number = 0,
      limit: number = 15
    ): PaginationRes<MyModel> {
      return (
        Model as MyModelStatic & { paginateManually: any }
      ).paginateManually(items, page, limit);
    }

    async sumField(
      field: keyof MyModel,
      where: WhereOptions = {},
      transaction?: Transaction
    ): Promise<number> {
      const res = await Model.sum(field, {
        where,
        ...(transaction && { transaction })
      });
      return isNaN(res) ? 0 : res;
    }

    async createOne(input: any, transaction?: Transaction): Promise<MyModel> {
      return await Model.create(input, { ...(transaction && { transaction }) });
    }
    async bulkCreate(
      models: any,
      transaction?: Transaction,
      updateOnDuplicate?: string[]
    ): Promise<MyModel[]> {
      return await Model.bulkCreate(models, {
        ...(transaction && { transaction }),
        ...(updateOnDuplicate && {
          updateOnDuplicate,
          conflictAttributes: ['id'],
          returning: false
        })
      });
    }

    async findOrCreate(
      where: WhereOptions = {},
      input: any = {},
      transaction?: Transaction
    ): Promise<MyModel> {
      const item = await Model.findOne({ where });
      if (!item)
        return await Model.create(input, {
          ...(transaction && { transaction })
        });
      return item;
    }

    async updateOneFromExistingModel(
      model: MyModel,
      input: object,
      transaction?: Transaction
    ): Promise<MyModel> {
      const res = await model.update(input, { transaction });
      return res;
    }

    async updateAll(
      where: WhereOptions = {},
      input: object = {},
      transaction?: Transaction
    ): Promise<MyModel[]> {
      const res = await Model.update(input, {
        returning: true,
        where,
        ...(transaction && { transaction })
      });
      return res[1];
    }

    async updateOne(
      where: WhereOptions = {},
      input: any,
      transaction?: Transaction
    ) {
      const res = await this.updateAll(where, input, transaction);
      return res[0];
    }

    async deleteAll(
      where: WhereOptions,
      transaction?: Transaction
    ): Promise<number> {
      return await Model.destroy({
        where,
        ...(transaction && { transaction })
      });
    }

    async deleteOne(where: WhereOptions, transaction?: Transaction) {
      return await Model.destroy({
        where,
        ...(transaction && { transaction }),
        force: true
      });
    }

    async truncateModel(): Promise<void> {
      return await Model.truncate({ force: true, cascade: true });
    }

    async rawDelete(): Promise<void> {
      await Model.sequelize.query(`delete from "${Model.tableName}"`);
    }

    async rawQuery<T>(sql: string): Promise<T> {
      return await Model.sequelize.query(sql)[0];
    }

    async countGroupedBy(
      where: WhereOptions,
      groupBy: keyof Model,
      alias: string,
      include: Includeable[] = []
    ): Promise<any> {
      return await Model.findAll({
        where,
        order: [groupBy],
        ...(include && { include }),
        attributes: {
          include: [[Sequelize.fn('COUNT', '*'), alias], groupBy],
          exclude: [...Object.keys(Model.getAttributes())]
        },
        group: groupBy,
        raw: true
      });
    }
  }

  return DatabaseRepositoryBuilder;
}
