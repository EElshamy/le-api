import { registerEnumType } from '@nestjs/graphql';
import { CourseUserFilterEnum } from '@src/course/inputs/course-user-filter.input';

export enum DiplomaStatusEnum {
  DRAFTED = 'DRAFTED',
  APPROVED = 'APPROVED',
  PREVIEWED = 'PREVIEWED'
}

export enum DiplomaSortEnum {
  CREATED_AT = 'createdAt',
  JOINED = '"diplomaDetail"."enrolledUsersCount"',
  PUBLISHED_AT = '"diplomaDetail"."publishedAt"',
  UPDATED_AT = 'updatedAt',
  PROFIT = 'profit'
  // REVENUE = 'lecturerShare'
}

export enum DiplomaProgramsSortEnum {
  ADDED_AT = 'createdAt'
}

export enum UsersSortEnum {
  JOINED_AT = 'createdAt',
  LAST_ACTIVE_AT = '"user"."lastActiveAt"',
  PROGRESS = CourseUserFilterEnum.PROGRESS // it is not a column in the Table
}

registerEnumType(DiplomaStatusEnum, { name: 'DiplomaStatus' });
registerEnumType(DiplomaSortEnum, { name: 'DiplomaSortEnum' });
registerEnumType(UsersSortEnum, { name: 'UsersSortEnum' });
