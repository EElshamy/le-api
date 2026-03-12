import { Inject, Injectable } from '@nestjs/common';
import { MyModel } from '@src/_common/database/database.static-model';
import { Op, Transaction, col, fn } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { PaginatorInput } from '../../_common/paginator/paginator.input';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { CourseStatusEnum } from '../../course/enums/course.enum';
import { Course } from '../../course/models/course.model';
import { CreateSkillInput } from './inputs/create-skill.input';
import { DeleteSkillInput } from './inputs/delete-skill.input';
import {
  SkillsBoardFilter,
  SkillsBoardSort
} from './inputs/skills-board.input';
import { UpdateSkillInput } from './inputs/update-skill.input';
import { CourseSkill } from './models/course-skill.model';
import { Skill } from './models/skill.model';
import { SkillSortEnum } from './skill.enum';

@Injectable()
export class SkillService {
  constructor(
    @Inject(Repositories.SkillsRepository)
    private readonly skillRepo: IRepository<Skill>,
    @Inject(Repositories.CourseSkillsRepository)
    private readonly courseSkillRepo: IRepository<CourseSkill>
  ) {}

  async createSkillBoard(input: CreateSkillInput) {
    return await this.skillRepo.createOne(input);
  }

  async bulkCreateSkillBoard(input: CreateSkillInput[]) {
    return await this.skillRepo.bulkCreate(input);
  }

  async updateSkillBoard(input: UpdateSkillInput) {
    let skill = await this.skillOrError(input.skillId);
    return await this.skillRepo.updateOne({ id: skill.id }, input);
  }

  async deleteSkillBoard(input: DeleteSkillInput) {
    if (input.skillId === input.reassignToSkillId)
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_REASSIGN_TO_THE_SAME_SKILL
      );
    const skill = await this.skillOrError(input.skillId);
    /** check if skill is in use by courses (except for drafted courses) */
    const isSkillUsed = await this.courseSkillRepo.findOne(
      { skillId: skill.id },
      [
        {
          model: Course,
          attributes: [],
          required: true,
          where: { status: { [Op.ne]: CourseStatusEnum.DRAFTED } }
        }
      ]
    );

    if (isSkillUsed && !input.reassignToSkillId) {
      throw new BaseHttpException(
        ErrorCodeEnum.CANNOT_DELETE_SKILL_WITHOUT_REASSIGN
      );
    }

    if (isSkillUsed) {
      await this.courseSkillRepo.updateAll(
        { skillId: skill.id },
        { skillId: input.reassignToSkillId }
      );
    }

    return !!(await this.skillRepo.deleteAll({ id: skill.id }));
  }

  async skillOrError(skillId: number) {
    const skill = await this.skillRepo.findOne({ id: skillId });
    if (!skill) throw new BaseHttpException(ErrorCodeEnum.SKILL_DOESNT_EXIST);
    return skill;
  }

  async skillsBoard(
    filter: SkillsBoardFilter = {},
    sort: SkillsBoardSort = {
      sortBy: SkillSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    },
    paginate: PaginatorInput = {}
  ) {
    return await this.skillRepo.findPaginated(
      {
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.searchKey && {
          [Op.or]: [
            { arName: { [Op.iLike]: `%${filter.searchKey}%` } },
            { enName: { [Op.iLike]: `%${filter.searchKey}%` } }
          ]
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
      { include: [[fn('COUNT', col('"skillId"')), 'timesUsed']] },
      null,
      null,
      ['"Skill"."id"']
    );
  }

  /**
   * @deprecated This method is deprecated. Use `setSkills` instead.
   */
  async setCourseSkills(
    course: Course,
    skillsIds: number[],
    transaction: Transaction
  ) {
    if (!skillsIds?.length) return;
    const skills = await this.skillRepo.findAll({
      id: skillsIds,
      isActive: true
    });

    if (skillsIds.length !== skills.length)
      throw new BaseHttpException(ErrorCodeEnum.SKILL_DOESNT_EXIST);
    await course.$set('skills', skills, { transaction });
  }

  async setSkills<T extends MyModel>(
    model: T,
    skillsIds: number[],
    transaction?: Transaction
  ) {
    if (!skillsIds?.length) return;
    const skills = await this.skillRepo.findAll({
      id: skillsIds,
      isActive: true
    });

    if (skillsIds.length !== skills.length)
      throw new BaseHttpException(ErrorCodeEnum.SKILL_DOESNT_EXIST);
    await model.$set('skills' as keyof T, skills, { transaction });
  }

  async activeSkills(paginate: PaginatorInput = {}) {
    return await this.skillRepo.findPaginated(
      { isActive: true },
      null,
      paginate.page,
      paginate.limit
    );
  }
}
