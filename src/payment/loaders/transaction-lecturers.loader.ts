import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Transaction } from '../models/transaction.model';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';

@Injectable()
export class TransactionsLecturersLoader {
  constructor(
    @Inject(Repositories.PurchaseItemsRepository)
    private readonly purchaseItemRepository: IRepository<PurchaseItem>,

    @Inject(Repositories.CourseLecturersRepository)
    private readonly courseLecturersRepository: IRepository<CourseLecturer>,

    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepository: IRepository<Lecturer>
  ) {}

  generateDataLoader(): DataLoader<string, Lecturer[]> {
    return new DataLoader(async (transactionIds: string[]) => {
      // 1️) Fetch all purchase items for the given transactions
      const purchaseItems = await this.purchaseItemRepository.findAll({
        purchaseId: { [Op.in]: transactionIds }
      });

      // Map transactionId -> all course IDs
      const transactionIdToCourseIds: Record<string, string[]> = {};
      transactionIds.forEach(id => (transactionIdToCourseIds[id] = []));

      purchaseItems.forEach(item => {
        if (item.productInfo?.length) {
          transactionIdToCourseIds[item.purchaseId].push(
            ...item.productInfo.map(pi => pi.id)
          );
        }
      });

      // 2️) Fetch course lecturers for all courses
      const allCourseIds = Object.values(transactionIdToCourseIds).flat();
      const courseLecturers = await this.courseLecturersRepository.findAll({
        courseId: { [Op.in]: allCourseIds }
      });

      // Map courseId -> lecturerIds
      const courseIdToLecturerIds: Record<string, string[]> = {};
      courseLecturers.forEach(cl => {
        if (!courseIdToLecturerIds[cl.courseId])
          courseIdToLecturerIds[cl.courseId] = [];
        courseIdToLecturerIds[cl.courseId].push(cl.lecturerId);
      });

      // 3️) Map transactionId -> unique lecturerIds
      const transactionIdToLecturerIds: Record<string, string[]> = {};
      transactionIds.forEach(tid => {
        const courseIds = transactionIdToCourseIds[tid] || [];
        const lecturerIds = courseIds.flatMap(
          cid => courseIdToLecturerIds[cid] || []
        );
        // remove duplicates
        transactionIdToLecturerIds[tid] = Array.from(new Set(lecturerIds));
      });

      // 4) Fetch all lecturers in a single query
      const allLecturerIds = Object.values(transactionIdToLecturerIds).flat();
      const lecturers = await this.lecturerRepository.findAll({
        id: { [Op.in]: Array.from(new Set(allLecturerIds)) }
      });

      // Map lecturerId -> lecturer object
      const lecturerMap: Record<string, Lecturer> = {};
      lecturers.forEach(l => (lecturerMap[l.id] = l));

      // 5️) Return lecturers for each transaction in the same order
      return transactionIds.map(tid =>
        (transactionIdToLecturerIds[tid] || []).map(lid => lecturerMap[lid])
      );
    });
  }
}
