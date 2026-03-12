import { ChangeLog } from '@src/course/models/course-log.model';
import { Course } from '@src/course/models/course.model';
import { Lesson } from '@src/course/models/lesson.model';
import { Review } from '@src/reviews/review.model';
import { Section } from '@src/course/models/section.model';
import * as DataLoader from 'dataloader';
import { BlogCategory } from '../../blogs/blog-category/bLog-category.model';
import { Tag } from '../../blogs/blog-tag/tag.model';
import { Category } from '../../course-specs/category/category.model';
import { Skill } from '../../course-specs/skill/models/skill.model';
import { Tool } from '../../course-specs/tool/models/tool.model';
import { CourseDetail } from '../../course/models/course-detail.model';
import { FieldOfTraining } from '../../field-of-training/field-of-training.model';
import { JobTitle } from '../../job-title/job-title.model';
import { Lecturer } from '../../lecturer/models/lecturer.model';
import { Notification } from '../../notification/models/notification.model';
import { NotificationReceiver } from '../../notification/notification.type';
import { SecurityGroup } from '../../security-group/security-group.model';
import { UserSocialAccount } from '../../social-auth/user-social-account.model';
import { User } from '../../user/models/user.model';

export type UserLoaderType = DataLoader<string, User>;
export type UsersLoaderType = DataLoader<string[], User[]>;
export type CoursesLoaderType = DataLoader<string[], Course[]>;
export type ReviewsLoaderType = DataLoader<string, Review[]>;
export type SecurityGroupLoaderType = DataLoader<string, SecurityGroup>;
export type NotificationParentLoaderType = DataLoader<Notification, any>;
export type NotificationReceiversLoaderType = DataLoader<
  Notification,
  NotificationReceiver[]
>;
export type UserSocialAccountsLoaderType = DataLoader<
  string,
  UserSocialAccount[]
>;
export type LecturerLoaderType = DataLoader<string, Lecturer>;
export type LecturersLoaderType = DataLoader<string[], Lecturer[]>;
export type JobTitleLoaderType = DataLoader<string, JobTitle>;
export type FieldOfTrainingsLoaderType = DataLoader<string, FieldOfTraining[]>;
export type BooleanLoaderType = DataLoader<string | number, boolean>;
export type CategoryLoaderType = DataLoader<string | number, Category>;
export type SkillLoaderType = DataLoader<string | number, Skill>;
export type ToolLoaderType = DataLoader<string | number, Tool>;
export type CourseDetailsLoaderType = DataLoader<number | string, CourseDetail>;
export type CourseLogsLoaderType = DataLoader<string, ChangeLog[]>;
export type SectionLessonLoaderType = DataLoader<string, Lesson[]>;
export type CourseSectionLoaderType = DataLoader<string, Section[]>;
export type ReviewsUsersDataloaderType = DataLoader<number, User>;
export type ReviewsCoursesDataloaderType = DataLoader<number, Course>;
export type UsersByCourseIdLoaderType = DataLoader<string, User[]>;

export type UserDataLoaderType = {
  userLoader: UserLoaderType;
  activeUserLoader: UserLoaderType;
  securityGroupLoader: SecurityGroupLoaderType;
  userByLecturerIdLoader: UserLoaderType;
  usersByCourseIdLoader: UsersByCourseIdLoaderType;
};

export type NotificationDataLoaderType = {
  notificationParentLoader: NotificationParentLoaderType;
  notificationReceiversLoader: NotificationReceiversLoaderType;
};
export type BlogCategoryLoaderType = DataLoader<any, BlogCategory>;
export type BlogTagLoaderType = DataLoader<string, Tag[]>;
