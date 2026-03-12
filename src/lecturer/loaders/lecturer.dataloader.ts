import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { IDataLoaderService } from '../../_common/dataloader/dataloader.interface';
import {
  FieldOfTrainingsLoaderType,
  LecturerLoaderType
} from '../../_common/dataloader/dataloader.type';
import { FieldOfTraining } from '../../field-of-training/field-of-training.model';
import { ApprovalStatusEnum } from '../enums/lecturer.enum';
import { LecturerFieldOfTraining } from '../models/lecturer-field-of-training.model';
import { Lecturer } from '../models/lecturer.model';

@Injectable()
export class LecturerDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.LecturerFieldOfTrainingsRepository)
    private readonly lecturerFieldOfTrainingRepo: IRepository<LecturerFieldOfTraining>,
    @Inject(Repositories.FieldOfTrainingsRepository)
    private readonly fieldOfTrainingRepo: IRepository<FieldOfTraining>
  ) {}
  createLoaders() {
    return {
      lecturersLoader: new DataLoader(
        async (lecturersIds: string[]) =>
          await this.findLecturersByIds(lecturersIds)
      ),
      lecturerLoader: <LecturerLoaderType>(
        new DataLoader(
          async (lecturersIds: string[]) =>
            await this.findLecturersByUserIds(lecturersIds)
        )
      ),
      lecturerFieldOfTrainingLoader: <FieldOfTrainingsLoaderType>(
        new DataLoader(
          async (lecturerId: string[]) =>
            await this.lecturerFieldOfTrainingsByLecturerId(lecturerId)
        )
      ),
      canJobTitleBeDeletedLoader: new DataLoader(
        async (jobTitleIds: string[]) => this.canJobTitleBeDeleted(jobTitleIds)
      ),
      canFieldOfTrainingBeDeletedLoader: new DataLoader(
        async (fieldOfTrainingIds: string[]) =>
          this.canFieldOfTrainingBeDeleted(fieldOfTrainingIds)
      )
    };
  }

  async findLecturersByIds(lecturersIds: string[]) {
    return await this.lecturerRepo.findAll({
      id: {
        [Op.in]: lecturersIds
      }
    });
  }

  async findLecturersByUserIds(lecturersIds: string[]) {
    const lecturers = await this.lecturerRepo.findAll({ userId: lecturersIds });
    return lecturersIds.map(lecturerId =>
      lecturers.find(lecturer => lecturer.userId === lecturerId)
    );
  }

  private async lecturerFieldOfTrainingsByLecturerId(lecturersIds: string[]) {
    const lecturersFieldsOfTrainings =
      await this.lecturerFieldOfTrainingRepo.findAll({
        lecturerId: lecturersIds
      });

    const fieldOfTrainings = await this.fieldOfTrainingRepo.findAll({
      id: lecturersFieldsOfTrainings.map(
        lecturerField => lecturerField.fieldOfTrainingId
      )
    });

    const lecturerFieldOfTrainings = lecturersFieldsOfTrainings.reduce(
      (total, lecturerField) => {
        if (!total[lecturerField.lecturerId])
          total[lecturerField.lecturerId] = [];
        total[lecturerField.lecturerId].push(
          fieldOfTrainings.find(
            field => field.id === lecturerField.fieldOfTrainingId
          )
        );
        return total;
      },
      {}
    );

    return lecturersIds.map(
      lecturerId => lecturerFieldOfTrainings[lecturerId] || []
    );
  }

  async canJobTitleBeDeleted(jobTitleIds: string[]) {
    const jobTitleLecturers = await this.lecturerRepo.countGroupedBy(
      { jobTitleId: jobTitleIds, status: ApprovalStatusEnum.APPROVED },
      'jobTitleId',
      'lecturersCount'
    );

    const isJobTitleUsed = new Map<string, boolean>();

    jobTitleLecturers.forEach(jobTitleLecturer => {
      isJobTitleUsed.set(
        jobTitleLecturer.jobTitleId,
        jobTitleLecturer.lecturersCount > 0
      );
    });

    return jobTitleIds.map(
      jobTitleId => !(isJobTitleUsed.get(jobTitleId) ?? false)
    );
  }

  async canFieldOfTrainingBeDeleted(fieldOfTrainingIds: string[]) {
    const fieldOfTrainingLecturers =
      await this.lecturerFieldOfTrainingRepo.countGroupedBy(
        {
          fieldOfTrainingId: fieldOfTrainingIds
        },
        'fieldOfTrainingId',
        'lecturersCount',
        [
          {
            model: Lecturer,
            where: { status: ApprovalStatusEnum.APPROVED },
            attributes: [],
            required: true
          }
        ]
      );

    const isFieldOfTrainingUsed = new Map<string, boolean>();

    fieldOfTrainingLecturers.forEach(fieldOfTrainingLecturer => {
      isFieldOfTrainingUsed.set(
        fieldOfTrainingLecturer.fieldOfTrainingId,
        true
      );
    });

    return fieldOfTrainingIds.map(
      fieldOfTrainingId =>
        !(isFieldOfTrainingUsed.get(fieldOfTrainingId) ?? false)
    );
  }
}
