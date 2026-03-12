import { Inject, Injectable } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { Op } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { NestDataLoader } from '../../_common/types/loader.interface';
import { User } from '../../user/models/user.model';
import { UsersAssignment } from '../models/user-assignments.model';

@Injectable()
export class UserAssignedCoursesLoader implements NestDataLoader {
  constructor(
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignedCoursesRepo: IRepository<UsersAssignment>
  ) {}

  /**
   * Generates a DataLoader for batch loading UserAssignedCourse by course IDs.
   * @param currentUser The current user making the request.
   */
  generateDataLoader(
    currentUser: User
  ): DataLoader<string, UsersAssignment | null> {
    return new DataLoader((courseIds: string[]) =>
      this.findUserAssignedCoursesByCourseIds(courseIds, currentUser)
    );
  }

  /**
   * Finds user-assigned courses by course IDs for the current user.
   * @param courseIds Array of course IDs to fetch.
   * @param currentUser The current user making the request.
   * @returns A promise resolving to an array of UserAssignedCourse or null for each course ID.
   */
  private async findUserAssignedCoursesByCourseIds(
    courseIds: string[],
    currentUser: User
  ): Promise<(UsersAssignment | null)[]> {
    const userAssignedCourses = await this.userAssignedCoursesRepo.findAll({
      courseId: { [Op.in]: courseIds },
      userId: currentUser.id
    });

    const assignedCoursesMap = userAssignedCourses.reduce(
      (map, assignedCourse) => map.set(assignedCourse.courseId, assignedCourse),
      new Map<string, UsersAssignment>()
    );

    return courseIds.map(id => assignedCoursesMap.get(id) || null);
  }
}
