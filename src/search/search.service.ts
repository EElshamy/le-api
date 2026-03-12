import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { BlogCategory } from '@src/blogs/blog-category/bLog-category.model';
import { BlogStatusEnum } from '@src/blogs/blog/blog.enum';
import { Blog } from '@src/blogs/blog/models/blog.model';
import { Category } from '@src/course-specs/category/category.model';
import {
  CourseStatusEnum,
  CourseTypeEnum,
  PublicationStatusEnum
} from '@src/course/enums/course.enum';
import { SearchSort, SearchSortInput } from '@src/course/inputs/search.types';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { User } from '@src/user/models/user.model';
import { plural } from 'pluralize';
import { Op, Sequelize } from 'sequelize';
import {
  SearchSpaceEnum,
  SearchSpaceUnionType
} from './enums/search-space.enum';
import { AllSearchResult } from './interfaces/all-search-result.interface';
import { GeneralSearchFilter } from './interfaces/inputs.interfaces';
import { SearchResult } from './interfaces/search-result.interface';
import { DiplomaStatusEnum } from '@src/diploma/enums/diploma-status.enum';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { SearchKeyword } from './entities/saerch-keyword.model';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';

@Injectable()
export class SearchService {
  constructor(
    private moduleRef: ModuleRef,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.DiplomasRepository)
    private readonly diplomaRepo: IRepository<Diploma>,
    @Inject(Repositories.BlogsRepository)
    private readonly blogRepo: IRepository<Blog>,
    @Inject(Repositories.SearchKeywordsRepository)
    private readonly searchKeywordRepo: IRepository<SearchKeyword>
  ) {}

  async recommendedPrograms(
    programId: string,
    programType: SearchSpaceEnum,
    limit: number
  ): Promise<SearchResult[]> {
    const searchResults: SearchResult[] = [];

    const program = await this.getSearchSpaceRepos()
      .filter(({ type }) => type === programType)[0]
      .repo.findOne({
        id: programId
      });

    await Promise.all(
      this.getSearchSpaceRepos().map(async ({ type, repo }) => {
        const results = await repo.findAll(
          {
            categoryId: program.categoryId,
            ...(programType === SearchSpaceEnum.COURSE && {
              status: CourseStatusEnum.APPROVED
            }),
            publicationStatus: PublicationStatusEnum.PUBLIC,
            id: { [Op.notIn]: [programId] }
          },
          [
            {
              model: Category
            }
          ]
        );
        results.map(item => {
          searchResults.push({
            type,
            category: item.category,
            id: item.id,
            arTitle: item.arTitle,
            enTitle: item.enTitle,
            thumbnail: item.thumbnail ?? 'default-thumbnail'
          });
        });
      })
    );

    return searchResults.slice(0, limit);
  }

  async search(
    filter: GeneralSearchFilter,
    paginator?: NullablePaginatorInput,
    sort?: SearchSortInput
  ): Promise<PaginationRes<SearchResult>> {
    if (!filter?.searchKey)
      return {
        items: [],
        pageInfo: {
          hasBefore: false,
          hasNext: false,
          page: 1,
          limit: 15,
          totalPages: 0,
          beforeCursor: null,
          totalCount: 0
        }
      };

    const searchResults: SearchResult[] = [],
      paginationInfo: Pick<PaginationRes<SearchResult>, 'pageInfo'> = {
        pageInfo: {
          page: paginator?.paginate?.page || 1,
          limit: paginator?.paginate?.limit || 15,
          totalPages: 0,
          hasBefore: false,
          hasNext: false,
          beforeCursor: null,
          direction: null,
          nextCursor: null,
          totalCount: 0
        }
      };

    // Search in all types if no specific type selected
    !filter?.type &&
      (await Promise.all(
        this.getSearchSpaceRepos().map(async ({ type, repo }) => {
          const results = await repo.findPaginated(
            {
              ...(filter?.searchKey && {
                [Op.or]: [
                  { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
                  { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
                  {
                    '$category.enName$': {
                      [Op.iLike]: `%${filter?.searchKey}%`
                    }
                  },
                  {
                    '$category.arName$': {
                      [Op.iLike]: `%${filter?.searchKey}%`
                    }
                  }
                ]
              }),
              ...(filter?.categoryIds && {
                categoryId: filter?.categoryIds
              }),
              ...(filter?.level && { level: filter?.level }),
              ...(filter?.price && {
                priceAfterDiscount: { [Op.gte]: filter?.price }
              }),
              ...(filter?.learningTime?.from && {
                learningTime: { [Op.gte]: filter?.learningTime?.from }
              }),
              ...(filter?.learningTime?.to && {
                learningTime: { [Op.lte]: filter?.learningTime?.to }
              }),
              ...(filter?.learningTime?.unit && {
                learningTimeUnit: { [Op.lte]: filter?.learningTime?.unit }
              }),
              status: CourseStatusEnum.APPROVED,
              publicationStatus: PublicationStatusEnum.PUBLIC
            },
            [
              [
                Sequelize.col(sort?.sort?.sortBy || 'createdAt'),
                sort?.sort?.sortType || SortTypeEnum.DESC
              ]
            ],
            paginator?.paginate?.page || 1,
            Math.floor(
              paginator?.paginate?.limit / Object.keys(SearchSpaceEnum).length
            ) || 15,
            [
              {
                model: Category
              }
            ]
          );
          results.items.map(item => {
            searchResults.push({
              ...(type === SearchSpaceEnum.COURSE ?
                {
                  type: this.mapLearningProgramType(
                    (<Course>(<unknown>item)).type
                  )
                }
              : { type: type }),
              category: item.category,
              id: item.id,
              arTitle: item.arTitle,
              enTitle: item.enTitle,
              thumbnail: item.thumbnail ?? 'default-thumbnail'
            });
          });

          paginationInfo.pageInfo = { ...results.pageInfo };
        })
      ));

    // Search in a specific type
    if (filter?.type) {
      const programRepo =
        filter?.type === SearchSpaceEnum.WORKSHOP ? 'Course' : filter?.type;
      const results = await (<IRepository<SearchSpaceUnionType>>(
        this.moduleRef.get(`${plural(programRepo)}Repository`, {
          strict: false
        })
      )).findPaginated(
        {
          ...(filter?.searchKey && {
            [Op.or]: [
              { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
              { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
              { '$category.enName$': { [Op.iLike]: `%${filter?.searchKey}%` } },
              { '$category.arName$': { [Op.iLike]: `%${filter?.searchKey}%` } }
            ]
          }),
          ...(filter?.categoryIds && {
            categoryId: filter?.categoryIds
          }),
          ...(filter?.level && { level: filter?.level }),
          ...(filter?.price && {
            priceAfterDiscount: { [Op.gte]: filter?.price }
          }),
          publicationStatus: PublicationStatusEnum.PUBLIC,
          status: CourseStatusEnum.APPROVED
        },
        [
          [
            Sequelize.col(sort?.sort?.sortBy || 'createdAt'),
            sort?.sort?.sortType || SortTypeEnum.DESC
          ]
        ],
        paginator?.paginate?.page || 1,
        paginator?.paginate?.limit || 15,
        [
          programRepo === 'Course' ?
            {
              model: Lecturer,
              include: [
                {
                  model: User,
                  where: {
                    ...(filter?.searchKey && {
                      [Op.or]: [
                        {
                          arFullName: { [Op.iLike]: `%${filter?.searchKey}%` }
                        },
                        { enFullName: { [Op.iLike]: `%${filter?.searchKey}%` } }
                      ]
                    })
                  }
                }
              ]
            }
          : {
              model: Course,
              include: [
                {
                  model: Lecturer,
                  include: [
                    {
                      model: User,
                      where: {
                        ...(filter?.searchKey && {
                          [Op.or]: [
                            {
                              arFullName: {
                                [Op.iLike]: `%${filter?.searchKey}%`
                              }
                            },
                            {
                              enFullName: {
                                [Op.iLike]: `%${filter?.searchKey}%`
                              }
                            }
                          ]
                        })
                      }
                    }
                  ]
                }
              ]
            },
          {
            model: Category
          }
        ]
      );

      results.items.map(item => {
        searchResults.push({
          type: filter?.type,
          category: item.category,
          id: item.id,
          arTitle: item.arTitle,
          enTitle: item.enTitle,
          thumbnail: item.thumbnail ?? 'default-thumbnail'
        });
      });
      paginationInfo.pageInfo = { ...results.pageInfo };
    }
    return {
      items: searchResults,
      pageInfo: {
        ...paginationInfo.pageInfo,
        limit: paginator?.paginate?.limit || 15,
        totalCount: paginationInfo.pageInfo.totalCount
      }
    };
  }

  async searchSuggestions(
    filter: GeneralSearchFilter,
    suggestionBarLength: number
  ): Promise<SearchResult[]> {
    if (!filter?.searchKey) return [];
    const searchResults: SearchResult[] = [];

    !filter?.type &&
      (await Promise.all(
        this.getSearchSpaceRepos().map(async ({ type, repo }) => {
          const users = await this.userRepo.findAll({
            ...(filter?.searchKey && {
              [Op.or]: [
                { arFullName: { [Op.iLike]: `%${filter?.searchKey}%` } },
                { enFullName: { [Op.iLike]: `%${filter?.searchKey}%` } }
              ]
            })
          });

          const lecturers = await this.lecturerRepo.findAll({
            userId: {
              [Op.in]: users.map(user => user.id)
            }
          });

          const resultsOfLectures = (
            await repo.findAll(
              {
                //  TODO handle this
                // lecturerId: {
                //   [Op.in]: lecturers.map(lecturer => lecturer.id)
                // }
              },
              [
                {
                  model: Category
                },
                {
                  model: CourseLecturer,
                  where: {
                    lecturerId: {
                      [Op.in]: lecturers.map(lecturer => lecturer.id)
                    }
                  }
                }
              ]
            )
          ).splice(
            0,
            Math.floor(
              suggestionBarLength / (Object.keys(SearchSpaceEnum).length + 1)
            )
          );

          resultsOfLectures.map(item => {
            searchResults.push({
              type,
              category: item.category,
              id: item.id,
              arTitle: item.arTitle,
              enTitle: item.enTitle,
              thumbnail: item.thumbnail ?? 'default-thumbnail'
            });
          });

          const results = (
            await repo.findAll(
              {
                ...(filter?.searchKey && {
                  [Op.or]: [
                    { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
                    { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } }
                  ]
                }),
                ...(filter?.categoryIds && {
                  categoryId: filter.categoryIds
                }),
                ...(filter?.level && { level: filter.level }),
                ...(filter?.price && {
                  priceAfterDiscount: { [Op.gte]: filter.price }
                })
              },
              [
                {
                  model: Category
                }
              ]
              // [
              //   {
              //     model: Lecturer,
              //     include: [
              //       {
              //         model: User,
              //         where: {
              //           ...(filter?.searchKey && {
              //             [Op.or]: [
              //               {
              //                 arFullName: {
              //                   [Op.iLike]: `%${filter?.searchKey}%`
              //                 }
              //               },
              //               {
              //                 enFullName: {
              //                   [Op.iLike]: `%${filter?.searchKey}%`
              //                 }
              //               }
              //             ]
              //           })
              //         }
              //       }
              //     ]
              //   }
              // ]
            )
          ).splice(
            0,
            Math.floor(
              suggestionBarLength / Object.keys(SearchSpaceEnum).length
            )
          );

          results.map(item => {
            searchResults.push({
              type,
              category: item.category,
              id: item.id,
              arTitle: item.arTitle,
              enTitle: item.enTitle,
              thumbnail: item.thumbnail ?? 'default-thumbnail'
            });
          });
        })
      ));

    if (filter?.type) {
      const results = (
        await (<IRepository<SearchSpaceUnionType>>this.moduleRef.get(
          `${plural(filter?.type)}Repository`,
          {
            strict: false
          }
        )).findAll(
          {
            ...(filter?.searchKey && {
              [Op.or]: [
                { enTitle: { [Op.iLike]: `%${filter?.searchKey}%` } },
                { arTitle: { [Op.iLike]: `%${filter?.searchKey}%` } }
              ]
            }),
            ...(filter?.categoryIds && {
              categoryId: filter.categoryIds
            }),
            ...(filter?.level && { level: filter.level }),
            ...(filter?.price && {
              priceAfterDiscount: { [Op.gte]: filter.price }
            })
          },
          [
            {
              model: Lecturer,
              include: [
                {
                  model: User,
                  where: {
                    ...(filter?.searchKey && {
                      [Op.or]: [
                        {
                          arFullName: { [Op.iLike]: `%${filter?.searchKey}%` }
                        },
                        { enFullName: { [Op.iLike]: `%${filter?.searchKey}%` } }
                      ]
                    })
                  }
                }
              ]
            },
            {
              model: Category
            }
          ]
        )
      ).splice(0, suggestionBarLength);

      results.map(item => {
        searchResults.push({
          type: filter?.type,
          category: item.category,
          id: item.id,
          arTitle: item.arTitle,
          enTitle: item.enTitle,
          thumbnail: item.thumbnail ?? 'default-thumbnail'
        });
      });
    }
    return searchResults;
  }

  private getSearchSpaceRepos<T extends SearchSpaceUnionType>(): {
    type: SearchSpaceEnum;
    repo: IRepository<T>;
  }[] {
    const searchSpaceRepos: {
      type: SearchSpaceEnum;
      repo: IRepository<T>;
    }[] = [];
    for (const key in SearchSpaceEnum) {
      if (key === 'WORKSHOP') {
        continue;
      }
      searchSpaceRepos.push({
        type: SearchSpaceEnum[key],
        repo: this.moduleRef.get(`${plural(SearchSpaceEnum[key])}Repository`, {
          strict: false
        })
      });
    }

    return searchSpaceRepos;
  }

  private mapLearningProgramType(type: CourseTypeEnum): SearchSpaceEnum {
    switch (type) {
      case CourseTypeEnum.COURSE:
        return SearchSpaceEnum.COURSE;
      case CourseTypeEnum.WORKSHOP:
        return SearchSpaceEnum.WORKSHOP;
      default:
        return SearchSpaceEnum.COURSE;
    }
  }

  async allSearch(
    filter: GeneralSearchFilter,
    sort: SearchSort
  ): Promise<AllSearchResult> {
    const courses = await this.courseRepo.findPaginated(
      {
        status: CourseStatusEnum.APPROVED,
        publicationStatus: PublicationStatusEnum.PUBLIC,
        ...(filter.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.enName$': { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.arName$': { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        }),
        ...(filter?.categoryIds && {
          categoryId: { [Op.in]: filter?.categoryIds }
        }),
        ...(filter.level && { level: { [Op.in]: filter.level } }),
        type: CourseTypeEnum.COURSE
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      1,
      3,
      [
        {
          model: Category,
          as: 'category'
        }
      ]
    );

    const workshops = await this.courseRepo.findPaginated(
      {
        status: CourseStatusEnum.APPROVED,
        publicationStatus: PublicationStatusEnum.PUBLIC,
        ...(filter.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.enName$': { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.arName$': { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        }),
        ...(filter?.categoryIds && {
          categoryId: { [Op.in]: filter?.categoryIds }
        }),
        ...(filter.level && { level: { [Op.in]: filter.level } }),
        type: CourseTypeEnum.WORKSHOP
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      1,
      2,
      [
        {
          model: Category,
          as: 'category'
        }
      ]
    );

    const diplomas = await this.diplomaRepo.findPaginated(
      {
        status: DiplomaStatusEnum.APPROVED,
        publicationStatus: PublicationStatusEnum.PUBLIC,
        ...(filter.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.enName$': { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.arName$': { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        }),
        ...(filter?.categoryIds && {
          categoryId: { [Op.in]: filter?.categoryIds }
        }),
        ...(filter.level && { level: { [Op.in]: filter.level } })
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      1,
      2,
      [
        {
          model: Category,
          as: 'category'
        }
      ]
    );

    const blogs = await this.blogRepo.findPaginated(
      {
        status: BlogStatusEnum.PUBLISHED,
        ...(filter.searchKey && {
          [Op.or]: [
            { enTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { arTitle: { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.enName$': { [Op.iLike]: `%${filter.searchKey}%` } },
            { '$category.arName$': { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
        }),
        ...(filter.categoryIds && { categoryId: filter.categoryIds })
      },
      [
        [
          Sequelize.col(sort?.sortBy || 'createdAt'),
          sort?.sortType || SortTypeEnum.DESC
        ]
      ],
      1,
      2,
      [
        {
          model: BlogCategory,
          as: 'category'
        }
      ]
    );

    return {
      courses: courses.items,
      diplomas: diplomas.items,
      workshops: workshops.items,
      blogs: blogs.items
    };
  }

  async searchKeywords(): Promise<SearchKeyword[]> {
    return await this.searchKeywordRepo.findAll(
      {},
      [],
      [['createdAt', 'DESC']]
    );
  }

  async createSearchKeyword(input: {
    arText: string;
    enText: string;
  }): Promise<SearchKeyword> {
    const existingKeywords = await this.searchKeywordRepo.findAll({});

    if (existingKeywords.length >= 4) {
      throw new BaseHttpException(ErrorCodeEnum.SEARCH_KEYWORD_LIMIT_EXCEEDED);
    }

    return await this.searchKeywordRepo.createOne({
      arText: input.arText.trim(),
      enText: input.enText.trim()
    });
  }

  async updateSearchKeyword(
    id: string,
    input: {
      arText?: string;
      enText?: string;
    }
  ): Promise<SearchKeyword> {
    const keyword = await this.searchKeywordRepo.findOne({ id });

    if (!keyword) {
      throw new BaseHttpException(ErrorCodeEnum.SEARCH_KEYWORD_NOT_FOUND);
    }

    return await await this.searchKeywordRepo.updateOneFromExistingModel(
      keyword,
      {
        arText: input.arText?.trim(),
        enText: input.enText?.trim()
      }
    );
  }

  async deleteSearchKeyword(id: string): Promise<void> {
    const keyword = await this.searchKeywordRepo.findOne({ id });

    if (!keyword) {
      throw new BaseHttpException(ErrorCodeEnum.SEARCH_KEYWORD_NOT_FOUND);
    }

    await keyword.destroy();
  }
}
