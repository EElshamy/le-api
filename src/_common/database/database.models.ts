import { AppConfiguration } from '@src/app-configuration/app-configuration.model';
import { BlogLike } from '@src/blogs/blog/models/blog-like.entity';
import { BlogView } from '@src/blogs/blog/models/blog-view.entity';
import { Blog } from '@src/blogs/blog/models/blog.model';
import { CartItem } from '@src/cart/models/cart-item.model';
import { Cart } from '@src/cart/models/cart.model';
import { PurchaseItem } from '@src/cart/models/purchase-item.model';
import { Purchase } from '@src/cart/models/purchase.model';
import { Certification } from '@src/certification/certification.model';
import { Comment } from '@src/comment/models/comment.model';
import { ContactMessage } from '@src/contact-message/models/contact-message.model';
import { Collection } from '@src/course/models/collection.model';
import { ChangeLog } from '@src/course/models/course-log.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { UserLessonProgress } from '@src/course/models/user-lesson-progress.model';
import { DashboardEmail } from '@src/dashboard-email/models/dashboard-email.entity';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { DiplomaDetail } from '@src/diploma/models/diploma-detail.model';
import { DiplomaSkills } from '@src/diploma/models/diploma-skills.model';
import { DiplomaTools } from '@src/diploma/models/diploma-tools.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Logs } from '@src/diploma/models/logs.model';
import { Faq } from '@src/faq/models/faq.model';
import { NotificationUserStatus } from '@src/notification/models/notification-user-status.model';
import { Notification } from '@src/notification/models/notification.model';
import { Coupon } from '@src/payment/models/coupons.model';
import { LearningProgramRevenueShare } from '@src/payment/models/revenue-share.model';
import { TransactionLog } from '@src/payment/models/transaction-logs.model';
import { Transaction } from '@src/payment/models/transaction.model';
import { WalletTransaction } from '@src/payment/models/wallet-transaction.model';
import { Wallet } from '@src/payment/models/wallet.model';
import { Policy } from '@src/policy/models/policy.model';
import { ContentReport } from '@src/report/models/report.model';
import { Review } from '@src/reviews/review.model';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { SystemConfig } from '@src/system-configuration/models/system-config.model';
import { UserVerificationCode } from '@src/user-verification-code/user-verification-code.model';
import { User } from '@src/user/models/user.model';
import { plural } from 'pluralize';
import { BlogCategory } from '../../blogs/blog-category/bLog-category.model';
import { BlogTag } from '../../blogs/blog-tag/blog-tag.model';
import { Tag } from '../../blogs/blog-tag/tag.model';
import { CommentLikes } from '../../comment/models/comment-like.model';
import { Category } from '../../course-specs/category/category.model';
import { CourseSkill } from '../../course-specs/skill/models/course-skill.model';
import { Skill } from '../../course-specs/skill/models/skill.model';
import { CourseTool } from '../../course-specs/tool/models/course-tool.mode';
import { Tool } from '../../course-specs/tool/models/tool.model';
import { CancelCoursePurchase } from '../../course/models/cancel-request.model';
import { CourseDetail } from '../../course/models/course-detail.model';
import { Course } from '../../course/models/course.model';
import { Lesson } from '../../course/models/lesson.model';
import { Section } from '../../course/models/section.model';
import { FieldOfTraining } from '../../field-of-training/field-of-training.model';
import { JobTitle } from '../../job-title/job-title.model';
import { DeletedLecturerRequestsLog } from '../../lecturer/models/deleted-lecturer-requests-log.model';
import { LecturerFieldOfTraining } from '../../lecturer/models/lecturer-field-of-training.model';
import { Lecturer } from '../../lecturer/models/lecturer.model';
import { LecturerRequest } from '../../lecturer/models/lecturer.request.model';
import { UserSocialAccount } from '../../social-auth/user-social-account.model';
import { ActiveUsersHistory } from '../../user-activity/models/active-users-history.model';
import { UserSession } from '../../user-sessions/user-sessions.model';
import { File } from '../uploader/file.model';
import { DeletedUsersLogs } from './backups/deleted-users-logs.model';
import { buildRepository } from './database-repository.builder';
import { BoardNotification } from '@src/notification/models/baord-notifications.model';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { UserQuizAttempt } from '@src/quiz/models/user-quiz-attempts.model';
import { QuizQuestion } from '@src/quiz/models/quiz-question.model';
import { QuizAnswer } from '@src/quiz/models/quiz-answer.model';
import { UserAnswer } from '@src/quiz/models/user-answer.model';
import { UserAnswerQuizAnswer } from '@src/quiz/models/user-answer-quiz-answer.model';
import { UserLessonVisit } from '@src/course/models/user-lesson-visit.model';
import { UserPasswordHistory } from '@src/user/models/user-password-history.model';
import { UserCourseDiplomaView } from '@src/diploma/models/user-course-diploma-view.model';
import { SearchKeyword } from '@src/search/entities/saerch-keyword.model';

export const models = [
  User,
  UserVerificationCode,
  SecurityGroup,
  AppConfiguration,
  Notification,
  BoardNotification,
  NotificationUserStatus,
  File,
  ContactMessage,
  SystemConfig,
  Faq,
  UserSession,
  UserSocialAccount,
  ActiveUsersHistory,
  JobTitle,
  FieldOfTraining,
  Lecturer,
  LecturerRequest,
  LecturerFieldOfTraining,
  Tool,
  Category,
  Skill,
  Course,
  CourseDetail,
  CourseSkill,
  CourseTool,
  Section,
  Lesson,
  Blog,
  BlogCategory,
  Tag,
  BlogTag,
  Collection,
  ChangeLog,
  UsersAssignment,
  Review,
  ContentReport,
  UserLessonProgress,
  Certification,
  Comment,
  CommentLikes,
  CancelCoursePurchase,
  Transaction,
  LearningProgramRevenueShare,
  Wallet,
  Coupon,
  Cart,
  CartItem,
  TransactionLog,
  Purchase,
  PurchaseItem,
  Diploma,
  DiplomaCourses,
  DiplomaDetail,
  DiplomaSkills,
  DiplomaTools,
  Logs,
  DeletedUsersLogs,
  WalletTransaction,
  DeletedLecturerRequestsLog,
  DashboardEmail,
  Policy,
  BlogLike,
  BlogView,
  CourseLecturer,
  QuizQuestion,
  QuizAnswer,
  UserAnswer,
  UserQuizAttempt,
  UserAnswerQuizAnswer,
  UserLessonVisit,
  UserPasswordHistory,
  UserCourseDiplomaView,
  SearchKeyword
];

export const repositories = models.map(m => ({
  provide: `${plural(m.name)}Repository`,
  useClass: buildRepository(m)
}));
