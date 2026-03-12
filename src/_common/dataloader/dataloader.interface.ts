import { User } from '@src/user/models/user.model';
import {
  BlogCategoryLoaderType,
  BlogTagLoaderType,
  BooleanLoaderType,
  CategoryLoaderType,
  CourseDetailsLoaderType,
  CourseLogsLoaderType,
  CoursesLoaderType,
  FieldOfTrainingsLoaderType,
  JobTitleLoaderType,
  LecturerLoaderType,
  LecturersLoaderType,
  NotificationParentLoaderType,
  NotificationReceiversLoaderType,
  ReviewsLoaderType,
  ReviewsUsersDataloaderType,
  SectionLessonLoaderType,
  SecurityGroupLoaderType,
  SkillLoaderType,
  ToolLoaderType,
  UserLoaderType,
  UsersByCourseIdLoaderType,
  UsersLoaderType,
  UserSocialAccountsLoaderType
} from './dataloader.type';

export interface IDataLoaderService {
  createLoaders(current?: User);
}

export interface IDataLoaders {
  reviewsLoader: ReviewsLoaderType;
  securityGroupLoader: SecurityGroupLoaderType;
  userLoader: UserLoaderType;
  activeUserLoader: UserLoaderType;
  notificationParentLoader: NotificationParentLoaderType;
  notificationReceiversLoader: NotificationReceiversLoaderType;
  userSocialAccountsLoader: UserSocialAccountsLoaderType;
  userByLecturerIdLoader: UserLoaderType;
  lecturerLoader: LecturerLoaderType;
  lecturersLoader: LecturersLoaderType;
  jobTitleLoader: JobTitleLoaderType;
  lecturerFieldOfTrainingLoader: FieldOfTrainingsLoaderType;
  canJobTitleBeDeletedLoader: BooleanLoaderType;
  canFieldOfTrainingBeDeletedLoader: BooleanLoaderType;
  canCategoryBeDeletedLoader: BooleanLoaderType;
  canSkillBeDeletedLoader: BooleanLoaderType;
  canToolBeDeletedLoader: BooleanLoaderType;
  skillByCourseIdsLoader: SkillLoaderType;
  categoryByIdsLoader: CategoryLoaderType;
  toolByCourseIdsLoader: ToolLoaderType;
  courseDetailsLoader: CourseDetailsLoaderType;
  blogCategoryLoader: BlogCategoryLoaderType;
  blogTagsLoader: BlogTagLoaderType;
  blogAuthorLoader: UserLoaderType;
  canBlogCategoryBeDeletedLoader: BooleanLoaderType;
  courseLogsLoader: CourseLogsLoaderType;
  sectionLessonsLoader: SectionLessonLoaderType;
  enrolledUserLoader: UsersLoaderType;
  coursesLoader: CoursesLoaderType;
  reviewsUsersDataloader: ReviewsUsersDataloaderType;
  courseSectionsLoader: SectionLessonLoaderType;
  isLiked: BooleanLoaderType;
  usersByCourseIdLoader: UsersByCourseIdLoaderType;
}
