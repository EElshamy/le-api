import { Inject, Injectable } from '@nestjs/common';
import { MyModel } from '@src/_common/database/database.static-model';
import { Op, Transaction, col, fn } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { PaginatorInput } from '../../_common/paginator/paginator.input';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { UploaderService } from '../../_common/uploader/uploader.service';
import { CourseStatusEnum } from '../../course/enums/course.enum';
import { Course } from '../../course/models/course.model';
import { CreateToolInput } from './inputs/create-tool.input';
import { DeleteToolInput } from './inputs/delete-tool.input';
import { ToolsBoardFilter, ToolsBoardSort } from './inputs/tools-board.input';
import { UpdateToolInput } from './inputs/update-tool.input';
import { CourseTool } from './models/course-tool.mode';
import { Tool } from './models/tool.model';
import { ToolSortEnum } from './tool.enum';

@Injectable()
export class ToolService {
  constructor(
    @Inject(Repositories.CourseToolsRepository)
    private readonly courseToolRepo: IRepository<CourseTool>,
    @Inject(Repositories.ToolsRepository)
    private readonly toolRepo: IRepository<Tool>,
    private readonly uploaderService: UploaderService
  ) {}

  async createToolBoard(input: CreateToolInput) {
    const tool = await this.toolRepo.createOne(input);
    await this.setToolUploadedFilesReferences([tool]);
    return tool;
  }

  private async setToolUploadedFilesReferences(tools: Tool[]) {
    for (const tool of tools) {
      await this.uploaderService.setUploadedFilesReferences(
        [tool.image],
        'Tool',
        'image',
        tool.id
      );
    }
  }

  async bulkCreateToolBoard(input: CreateToolInput[]) {
    const tools = await this.toolRepo.bulkCreate(input);
    await this.setToolUploadedFilesReferences(tools);
    return tools;
  }

  async updateToolBoard(input: UpdateToolInput) {
    let tool = await this.toolOrError(input.toolId);
    tool = await this.toolRepo.updateOne({ id: tool.id }, input);
    await this.setToolUploadedFilesReferences([tool]);
    return tool;
  }

  async deleteToolBoard(input: DeleteToolInput) {
    if (input.toolId === input.reassignToToolId)
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_REASSIGN_TO_THE_SAME_TOOL
      );
    const tool = await this.toolOrError(input.toolId);
    /** check if tool is in use by courses (except for drafted courses) */
    const isToolUsed = await this.courseToolRepo.findOne({ toolId: tool.id }, [
      {
        model: Course,
        attributes: [],
        required: true,
        where: { status: { [Op.ne]: CourseStatusEnum.DRAFTED } }
      }
    ]);

    if (isToolUsed && !input.reassignToToolId) {
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_DELETE_TOOL_WITHOUT_REASSIGN
      );
    }

    if (isToolUsed) {
      await this.courseToolRepo.updateAll(
        { toolId: tool.id },
        { toolId: input.reassignToToolId }
      );
    }
    return !!(await this.toolRepo.deleteAll({ id: tool.id }));
  }

  async toolOrError(toolId: number) {
    const tool = await this.toolRepo.findOne({ id: toolId });
    if (!tool) throw new BaseHttpException(ErrorCodeEnum.TOOL_DOESNT_EXIST);
    return tool;
  }

  async toolsBoard(
    filter: ToolsBoardFilter = {},
    sort: ToolsBoardSort = {
      sortBy: ToolSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = {}
  ) {
    return await this.toolRepo.findPaginated(
      {
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.searchKey && {
          name: { [Op.iLike]: `%${filter.searchKey}%` }
        })
      },
      [[sort.sortBy, sort.sortType]],
      paginate.page,
      paginate.limit,
      [
        {
          model: Course,
          required: false,
          attributes: [],
          where: {
            status: { [Op.ne]: CourseStatusEnum.DRAFTED }
          },
          through: {
            attributes: []
          }
        }
      ],
      { include: [[fn('COUNT', col('"toolId"')), 'timesUsed']] },
      null,
      null,
      ['"Tool"."id"']
    );
  }

  async setTools<T extends MyModel>(
    model: T,
    toolsIds: number[],
    transaction?: Transaction
  ) {
    if (!toolsIds?.length) return;

    const tools = await this.toolRepo.findAll({ id: toolsIds, isActive: true });

    if (toolsIds?.length !== tools?.length)
      throw new BaseHttpException(ErrorCodeEnum.TOOL_DOESNT_EXIST);
    await model.$set('tools' as keyof T, tools, { transaction });
  }

  async activeTools(paginate: PaginatorInput = {}) {
    return await this.toolRepo.findPaginated(
      { isActive: true },
      null,
      paginate.page,
      paginate.limit
    );
  }
}
