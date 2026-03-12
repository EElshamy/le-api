import { GroupOption, Op } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import { MyModelStatic } from '../database/database.static-model';
import {
  CursorBasedPaginationArgsType,
  CursorBasedPaginationDirection,
  CursorBasedSortType,
  PaginationRes
} from './paginator.types';

/**
 * AFTER + DESC is the same as BEFORE + ASC
 * AFTER + ASC is the same as BEFORE + DESC
 * the default case here is AFTER + DESC
 * items will include cursor regardless of sort or direction
 */

export const cursorPaginate = async <T>(
  args: CursorBasedPaginationArgsType
): Promise<PaginationRes<T>> => {
  let dateCursor = args.cursor && new Date(Number(args.cursor)),
    sort = args.sort || CursorBasedSortType.DESC,
    sortBy = args.sortBy || 'createdAt';

  let sequelizeOperator = Op.lte,
    sequelizeOperatorForSingle = Op.gt,
    realOrder = CursorBasedSortType.DESC,
    realOrderForSingle = CursorBasedSortType.ASC;

  if (
    (sort === CursorBasedSortType.ASC &&
      args.direction === CursorBasedPaginationDirection.AFTER) ||
    (sort === CursorBasedSortType.DESC &&
      args.direction === CursorBasedPaginationDirection.BEFORE)
  ) {
    sequelizeOperator = Op.gte;
    sequelizeOperatorForSingle = Op.lt;
    realOrder = CursorBasedSortType.ASC; // + reverse
    realOrderForSingle = CursorBasedSortType.DESC;
  }

  let items = await args.model.findAll({
    where: {
      ...args.filter,
      ...(dateCursor && {
        [sortBy]: { [sequelizeOperator]: new Date(dateCursor) }
      })
    },
    order: [[`${sortBy}`, realOrder]],
    limit: args.limit + 1,
    include: args.include,
    subQuery: false,
    nest: true,
    raw: true
  });

  let hasNext = items.length === args.limit + 1,
    hasBefore = items.length === args.limit + 1,
    nextCursor = null,
    beforeCursor = null,
    nextCursorRecord = hasNext ? items[args.limit] : null,
    beforeCursorRecord = hasBefore ? items[args.limit] : null;

  if (!items.length)
    return {
      pageInfo: { nextCursor, hasNext, beforeCursor, hasBefore },
      items: <any>items
    };

  if (!dateCursor) dateCursor = new Date(items[0][sortBy]);

  const item = await args.model.findOne({
    where: {
      ...args.filter,
      ...(dateCursor && {
        [sortBy]: { [sequelizeOperatorForSingle]: new Date(dateCursor) }
      })
    },
    order: [[`${sortBy}`, realOrderForSingle]],
    limit: 1,
    include: args.include,
    subQuery: false,
    nest: true,
    raw: true
  });

  if (args.direction === CursorBasedPaginationDirection.BEFORE) {
    hasNext = !!item;
    if (item) {
      nextCursorRecord = item;
      items.unshift(item); // not `push` because of reversing
    }
  }

  if (args.direction === CursorBasedPaginationDirection.AFTER) {
    hasBefore = !!item;
    if (item) {
      beforeCursorRecord = item;
      items.unshift(item);
    }
  }

  if (hasNext) {
    nextCursor = nextCursorRecord[sortBy].getTime().toString();
    items = items.filter(i => i !== nextCursorRecord);
  }
  if (hasBefore) {
    beforeCursor = beforeCursorRecord[sortBy].getTime().toString();
    items = items.filter(i => i !== beforeCursorRecord);
  }

  if (args.direction === CursorBasedPaginationDirection.BEFORE) items.reverse();

  return {
    pageInfo: {
      nextCursor,
      hasNext,
      beforeCursor,
      hasBefore,
      direction: args.direction
    },
    items: <any>items
  };
};

export const paginate = async <T>(
  model: MyModelStatic,
  filter = {},
  sort: string | Literal = '-createdAt',
  page = 0,
  limit = 15,
  include: any = [],
  attributes: any = null,
  isNestAndRaw: boolean = true,
  subQuery: boolean = false,
  group?: GroupOption,
  distinct: boolean = true,
): Promise<PaginationRes<T>> => {
  let totalPages = 0,
    totalCount = 0,
    hasNext = false;
  // Using `findAll` instead of `count` because `count` generates a different SQL
  // totalCount = (
  //   await model.findAll({
  //     where: filter,
  //     include,
  //     attributes,
  //     nest: isNestAndRaw,
  //     raw: isNestAndRaw,
  //     ...(attributes && { attributes })
  //   })
  // ).length;

  //Using count instead of 'findAll' because findAll uses too much memory for large datasets
  totalCount = await model.count({
    where: filter,
    include,
    ...(attributes && { attributes }),
    distinct
  });

  if (limit > 50) limit = 50;
  if (limit < 0) limit = 15;
  if (page < 1) page = 1;
  totalPages = totalCount / limit < 1 ? 1 : Math.ceil(totalCount / limit);
  let skip = page > 1 ? (page - 1) * limit : 0;
  hasNext = skip + limit < totalCount;
  if (!sort) sort = '-createdAt';
  let order = null;
  // Literal query
  if (typeof sort === 'object') order = sort;
  else order = [[sort.replace('-', ''), sort.startsWith('-') ? 'DESC' : 'ASC']];

  let items = await model.findAll({
    where: filter,
    ...(order && { order }),
    limit,
    offset: skip,
    include,
    nest: isNestAndRaw,
    raw: isNestAndRaw,
    ...(attributes && { attributes }),
    ...(subQuery !== undefined && { subQuery }),
    ...(group && { group }),
    ...(distinct && { distinct })
  });
  return {
    pageInfo: {
      hasBefore: page > 1,
      page,
      limit,
      hasNext,
      totalCount,
      totalPages
    },
    items: <any>items
  };
};

export const manualPaginator = <T>(
  array: T[] = [],
  filter = {},
  sort = '-createdAt',
  page = 0,
  limit = 15
): PaginationRes<T> => {
  let res = {
    pageInfo: {
      page: 0,
      hasNext: false,
      hasBefore: false
    },
    items: []
  };
  if (!array || !array.length) return res;
  let totalPages = 0,
    totalCount = 0,
    hasNext = false;
  let sortField = sort;
  sortField = sort && sort.startsWith('-') ? sort.replace('-', '') : null;
  let items =
    !sort ? array
    : sort.startsWith('-') ? array.sort((a, b) => b[sortField] - a[sortField])
    : array.sort((a, b) => a[sortField] - b[sortField]);
  if (filter && Object.keys(filter).length) {
    items = array.filter(entity => {
      for (let i in filter) {
        return entity[i] === filter[i];
      }
    });
  }
  totalCount = items.length;
  if (limit > 50) limit = 50;
  if (limit < 0) limit = 15;
  if (page < 0) page = 0;
  totalPages = totalCount / limit < 1 ? 1 : Math.ceil(totalCount / limit);
  let skip = page > 1 ? (page - 1) * limit : 0;
  hasNext = skip + limit < totalCount;
  items = items.slice(skip, limit + skip);
  return {
    pageInfo: {
      page,
      hasNext,
      hasBefore: page > 1
    },
    items
  };
};

export const manualPaginatorReturnsArray = <T>(
  array: T[] = [],
  filter = {},
  sort = '-createdAt',
  page = 0,
  limit = 15
): T[] => {
  if (!array || !array.length) return [];
  let sortField = sort;
  sortField = sort && sort.startsWith('-') ? sort.replace('-', '') : null;
  let items =
    !sort ? array
    : sort.startsWith('-') ? array.sort((a, b) => b[sortField] - a[sortField])
    : array.sort((a, b) => a[sortField] - b[sortField]);
  if (filter && Object.keys(filter).length) {
    items = array.filter(entity => {
      for (let i in filter) {
        return entity[i] === filter[i];
      }
    });
  }
  if (limit > 50) limit = 50;
  if (limit < 0) limit = 15;
  if (page < 0) page = 0;
  let skip = page > 1 ? (page - 1) * limit : 0;
  items = items.slice(skip, limit + skip);
  return items;
};
