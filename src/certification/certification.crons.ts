import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import { Course } from '@src/course/models/course.model';
import { IRepository } from '@src/_common/database/repository.interface';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { User } from '@src/user/models/user.model';
import { CourseDetail } from '@src/course/models/course-detail.model';
import { Certification } from './certification.model';
import { CertificationType } from './certifications.type';
import { CertificationService } from './certification.service';

@Injectable()
export class CertificationCrons {
  constructor(
    @Inject(Repositories.CertificationsRepository)
    private readonly certificationRepo: IRepository<Certification>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    private readonly certificationService: CertificationService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  // @Cron(CronExpression.EVERY_MINUTE)
  async generateAceCertificates(): Promise<void> {
    // get all pending ace certifications
    const pendingAceCertifications = await this.certificationRepo.findAll({
      pending: true,
      certificationType: CertificationType.ACE,
      expectedCertificationDate: {
        [Op.lte]: new Date()
      }
    });

    console.log(
      `there is ${pendingAceCertifications.length} pending ace certifications 🍟`
    );

    for (const certification of pendingAceCertifications) {
      const learningProgram = await this.courseRepo.findOne(
        {
          id: certification.learningProgramId
        },
        [
          {
            model: CourseDetail
          }
        ]
      );

      const user = await this.userRepo.findOne({
        id: certification.userId,
        isDeleted: false,
        isBlocked: false
      });

      if (!user) {
        continue;
      }

      await this.certificationService.generateCertification(
        certification,
        learningProgram,
        certification.learningProgramType,
        user,
        certification.enUserName,
        certification.arUserName,
        CertificationType.ACE
      );

      await this.certificationRepo.updateOneFromExistingModel(certification, {
        pending: false
      });
    }
  }
}
