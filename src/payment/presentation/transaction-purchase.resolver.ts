import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { TransactionPurchaseItemForAdmin } from '../interfaces/transaction-preview.interface';
import { CartService } from '@src/cart/services/cart.service';
import { Category } from '@src/course-specs/category/category.model';
import { LangEnum } from '@src/user/user.enum';
import { TransactionService } from '../services/transaction.service';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { Inject } from '@nestjs/common';
import { IRepository } from '@src/_common/database/repository.interface';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { Course } from '@src/course/models/course.model';
import { Op } from 'sequelize';

@Resolver(() => TransactionPurchaseItemForAdmin)
export class TransactionPurchaseItemForAdminResolver {
  constructor(
    private readonly transactionService: TransactionService,
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>
  ) {}

  @ResolveField(() => Category, { nullable: true })
  async category(
    @Parent() item: TransactionPurchaseItemForAdmin,
    @Context('lang') lang: LangEnum
  ): Promise<Category> {
    const learningProgram = await this.transactionService.getLearningProgram(
      item.learningProgramId,
      item.type
    );

    return learningProgram?.category || null;
  }

  @ResolveField(() => Number, { nullable: true })
  async lessonsCount(
    @Parent() item: TransactionPurchaseItemForAdmin,
    @Context('lang') lang: LangEnum
  ): Promise<number> {
    const learningProgram = await this.transactionService.getLearningProgram(
      item.learningProgramId,
      item.type
    );

    const lessonsCount = learningProgram?.courseDetail?.lessonsCount;
    return lessonsCount ?? null;
  }

  @ResolveField(() => LangEnum, { nullable: true })
  async language(
    @Parent() item: TransactionPurchaseItemForAdmin,
    @Context('lang') lang: LangEnum
  ): Promise<LangEnum> {
    const learningProgram = await this.transactionService.getLearningProgram(
      item.learningProgramId,
      item.type
    );

    return learningProgram?.language || null;
  }

  @ResolveField(() => [Course], { nullable: true })
  async diplomaPrograms(
    @Parent() item: TransactionPurchaseItemForAdmin,
    @Context('lang') lang: LangEnum
  ): Promise<Course[]> {
    if (item.type !== LearningProgramTypeEnum.DIPLOMA) {
      return null;
    }

    const diplomaCoursesIds = (
      await this.diplomaCoursesRepo.findAll({
        diplomaId: item.learningProgramId,
        keptForOldAssignments: false
      })
    ).map(item => item.courseId);

    const courses = await this.courseRepo.findAll({
      id: { [Op.in]: diplomaCoursesIds }
    });

    return courses || [];
  }
}
