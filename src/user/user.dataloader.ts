import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import * as DataLoader from 'dataloader';
import { IDataLoaderService } from '../_common/dataloader/dataloader.interface';
import {
  SecurityGroupLoaderType,
  UserDataLoaderType,
  UserLoaderType
} from '../_common/dataloader/dataloader.type';
import { HelperService } from '../_common/utils/helper.service';
import { Lecturer } from '../lecturer/models/lecturer.model';
import { SecurityGroup } from '../security-group/security-group.model';
import { User } from './models/user.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';

@Injectable()
export class UserDataloader implements IDataLoaderService {
  constructor(
    @Inject(Repositories.SecurityGroupsRepository)
    private readonly securityGroupRepo: IRepository<SecurityGroup>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.CourseLecturersRepository)
    private readonly courseLecturersRepo: IRepository<CourseLecturer>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    private readonly helper: HelperService
  ) {}

  public createLoaders(): UserDataLoaderType {
    const userLoader: UserLoaderType = new DataLoader(
      async (senderIds: string[]) => await this.findUserByIds(senderIds)
    );

    const securityGroupLoader: SecurityGroupLoaderType = new DataLoader(
      async (senderIds: string[]) =>
        await this.findSecurityGroupsByIds(senderIds)
    );

    const activeUserLoader: UserLoaderType = new DataLoader(
      async (senderIds: string[]) => await this.findActiveUsersByIds(senderIds)
    );

    const userByLecturerIdLoader: UserLoaderType = new DataLoader(
      async (lecturersIds: string[]) =>
        await this.getUsersByLecturersIds(lecturersIds)
    );

    const usersByCourseIdLoader: DataLoader<string, User[]> = new DataLoader(
      async (courseIds: string[]) => {
        return await this.getUsersByCourseIds(courseIds);
      }
    );

    return {
      userLoader,
      securityGroupLoader,
      activeUserLoader,
      userByLecturerIdLoader,
      usersByCourseIdLoader
    };
  }

  private async findSecurityGroupsByIds(securityGroupsIds: string[]) {
    const securityGroups = await this.securityGroupRepo.findAll({
      id: securityGroupsIds
    });
    const securityGroupMap = this.helper.deriveMapFromArray(
      securityGroups,
      (securityGroup: SecurityGroup) => securityGroup.id
    );
    return securityGroupsIds.map(id => securityGroupMap.get(id));
  }

  private async findUserByIds(usersIds: string[]) {
    const users = await this.userRepo.findAll({ id: usersIds });
    const userMap = this.helper.deriveMapFromArray(
      users,
      (user: User) => user.id
    );
    return usersIds.map(id => userMap.get(id));
  }

  private async findActiveUsersByIds(usersIds: string[]) {
    const users = await this.userRepo.findAll({
      id: usersIds,
      isBlocked: false
    });
    const userMap = this.helper.deriveMapFromArray(
      users,
      (user: User) => user.id
    );
    return usersIds.map(id => userMap.get(id));
  }

  private async getUsersByLecturersIds(lecturersIds: string[]) {
    const users = await this.userRepo.findAll({}, [
      { model: Lecturer, where: { id: lecturersIds }, attributes: ['id'] }
    ]);
    return lecturersIds.map(lecturerId =>
      users.find(user => user.lecturer.id === lecturerId)
    );
  }

  private async getUsersByCourseIds(courseIds: string[]): Promise<User[][]> {
    const courseLecturers = await this.courseLecturersRepo.findAll({
      courseId: courseIds
    });

    // console.log('courseLecturers', courseLecturers);
    // console.log('---------------------');

    const lecturerIds = courseLecturers.map(cl => cl.lecturerId);

    // console.log('lecturerIds', lecturerIds);
    // console.log('---------------------');

    const lecturers = await this.lecturerRepo.findAll({ id: lecturerIds });
    const lecturerIdToUserId = new Map(lecturers.map(l => [l.id, l.userId]));

    // console.log('lecturerIdToUserId', lecturerIdToUserId);
    // console.log('---------------------');

    const userIds = Array.from(lecturerIdToUserId.values());
    const users = (
      await this.userRepo.findAll({ id: userIds }, [{ model: Lecturer }])
    ).map(user => user.dataValues);

    // console.log('users', users);
    // console.log('---------------------');

    const courseIdToUsersMap: Record<string, User[]> = {};

    for (const courseId of courseIds) {
      const relatedLecturerIds = courseLecturers
        .filter(cl => cl.courseId === courseId)
        .map(cl => cl.lecturerId);

      const relatedUserIds = relatedLecturerIds
        .map(lecturerId => lecturerIdToUserId.get(lecturerId))
        .filter(Boolean);

      courseIdToUsersMap[courseId] = users.filter(user =>
        relatedUserIds.includes(user.id)
      );
    }

    // console.log(courseIds.map(courseId => courseIdToUsersMap[courseId] || []));

    return courseIds.map(courseId => courseIdToUsersMap[courseId] || []);
  }
}
