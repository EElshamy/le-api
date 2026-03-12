import { PermissionsGroups } from './permissions.type';

export enum AnalyticsPermissionsEnum {
  READ_ANALYTICS = 'READ_ANALYTICS',
  EXPORT_CSV_ANALYTICS = 'EXPORT_CSV_ANALYTICS'
}

export enum UserPermissionsEnum {
  READ_USERS = 'READ_USERS',
  UPDATE_USERS = 'UPDATE_USERS',
  CREATE_USERS = 'CREATE_USERS',
  DELETE_USERS = 'DELETE_USERS',
  EXPORT_CSV_USERS = 'EXPORT_CSV_USERS'
}

export enum LecturerPermissionEnum {
  READ_LECTURER = 'READ_LECTURER',
  UPDATE_LECTURER = 'UPDATE_LECTURER',
  CREATE_LECTURER = 'CREATE_LECTURER',
  DELETE_LECTURER = 'DELETE_LECTURER',
  EXPORT_CSV_LECTURER = 'EXPORT_CSV_LECTURER'
}

export enum BlogTagsPermissionEnum {
  READ_BLOG_TAGS = 'READ_BLOG_TAGS',
  CREATE_BLOG_TAGS = 'CREATE_BLOG_TAGS',
  UPDATE_BLOG_TAGS = 'UPDATE_BLOG_TAGS',
  DELETE_BLOG_TAGS = 'DELETE_BLOG_TAGS'
}

export enum CoursePermissionsEnum {
  READ_COURSES = 'READ_COURSES',
  CREATE_COURSES = 'CREATE_COURSES',
  UPDATE_COURSES = 'UPDATE_COURSES',
  DELETE_COURSES = 'DELETE_COURSES',
  EXPORT_CSV_COURSES = 'EXPORT_CSV_COURSES'
}

export enum WorkshopPermissionsEnum {
  READ_WORKSHOPS = 'READ_WORKSHOPS',
  CREATE_WORKSHOPS = 'CREATE_WORKSHOPS',
  UPDATE_WORKSHOPS = 'UPDATE_WORKSHOPS',
  DELETE_WORKSHOPS = 'DELETE_WORKSHOPS',
  EXPORT_CSV_WORKSHOPS = 'EXPORT_CSV_WORKSHOPS'
}

export enum DiplomaPermissionsEnum {
  READ_DIPLOMAS = 'READ_DIPLOMAS',
  CREATE_DIPLOMAS = 'CREATE_DIPLOMAS',
  UPDATE_DIPLOMAS = 'UPDATE_DIPLOMAS',
  DELETE_DIPLOMAS = 'DELETE_DIPLOMAS',
  EXPORT_CSV_DIPLOMAS = 'EXPORT_CSV_DIPLOMAS'
}

export enum BlogPermissionsEnum {
  CREATE_BLOGS = 'CREATE_BLOGS',
  READ_BLOGS = 'READ_BLOGS',
  UPDATE_BLOGS = 'UPDATE_BLOGS',
  DELETE_BLOGS = 'DELETE_BLOGS',
  EXPORT_CSV_BLOGS = 'EXPORT_CSV_BLOGS'
}

export enum TransactionPermissionsEnum {
  READ_TRANSACTIONS = 'READ_TRANSACTIONS',
  UPDATE_TRANSACTIONS = 'UPDATE_TRANSACTIONS',
  DELETE_TRANSACTIONS = 'DELETE_TRANSACTIONS',
  EXPORT_CSV_TRANSACTIONS = 'EXPORT_CSV_TRANSACTIONS'
}

export enum PayoutPermissionsEnum {
  READ_PAYOUTS = 'READ_PAYOUTS',
  UPDATE_PAYOUTS = 'UPDATE_PAYOUTS',
  DELETE_PAYOUTS = 'DELETE_PAYOUTS',
  EXPORT_CSV_PAYOUTS = 'EXPORT_CSV_PAYOUTS'
}

export enum CouponPermissionsEnum {
  READ_COUPONS = 'READ_COUPONS',
  CREATE_COUPONS = 'CREATE_COUPONS',
  UPDATE_COUPONS = 'UPDATE_COUPONS',
  DELETE_COUPONS = 'DELETE_COUPONS',
  EXPORT_CSV_COUPONS = 'EXPORT_CSV_COUPONS'
}

export enum ReportPermissionsEnum {
  READ_REPORTS = 'READ_REPORTS',
  UPDATE_REPORTS = 'UPDATE_REPORTS',
  DELETE_REPORTS = 'DELETE_REPORTS',
  EXPORT_CSV_REPORTS = 'EXPORT_CSV_REPORTS'
}

export enum EmailsPermissionsEnum {
  READ_EMAILS = 'READ_EMAILS',
  CREATE_EMAILS = 'CREATE_EMAILS',
  UPDATE_EMAILS = 'UPDATE_EMAILS',
  DELETE_EMAILS = 'DELETE_EMAILS'
}

export enum LegalContentPermissionsEnum {
  READ_LEGAL_CONTENTS = 'READ_LEGAL_CONTENTS',
  UPDATE_LEGAL_CONTENTS = 'UPDATE_LEGAL_CONTENTS',
  DELETE_LEGAL_CONTENTS = 'DELETE_LEGAL_CONTENTS'
}

export enum FaqPermissionsEnum {
  READ_FAQS = 'READ_FAQS',
  UPDATE_FAQS = 'UPDATE_FAQS',
  DELETE_FAQS = 'DELETE_FAQS'
}

export enum ContactMessagePermissionsEnum {
  READ_CONTACT_MESSAGES = 'READ_CONTACT_MESSAGES',
  UPDATE_CONTACT_MESSAGES = 'UPDATE_CONTACT_MESSAGES',
  DELETE_CONTACT_MESSAGES = 'DELETE_CONTACT_MESSAGES'
}

export enum InboxPermissionsEnum {
  READ_INBOX = 'READ_INBOX',
  DELETE_INBOX = 'DELETE_INBOX',
  UPDATE_INBOX = 'UPDATE_INBOX',
  EXPORT_CSV = 'EXPORT_CSV_INBOX'
}

export enum RolesPermissionsEnum {
  READ_ROLES = 'READ_ROLES',
  CREATE_ROLES = 'CREATE_ROLES',
  UPDATE_ROLES = 'UPDATE_ROLES',
  DELETE_ROLES = 'DELETE_ROLES',
  EXPORT_CSV_ROLES = 'EXPORT_CSV_ROLES'
}

export enum AdministratorPermissionsEnum {
  READ_ADMINISTRATORS = 'READ_ADMINISTRATORS',
  UPDATE_ADMINISTRATORS = 'UPDATE_ADMINISTRATORS',
  CREATE_ADMINISTRATORS = 'CREATE_ADMINISTRATORS',
  DELETE_ADMINISTRATORS = 'DELETE_ADMINISTRATORS'
}

export enum CategoriesLearningProgramsPermissionsEnum {
  READ_CATEGORIES_LEARNING_PROGRAMS = 'READ_CATEGORIES_LEARNING_PROGRAMS',
  CREATE_CATEGORIES_LEARNING_PROGRAMS = 'CREATE_CATEGORIES_LEARNING_PROGRAMS',
  UPDATE_CATEGORIES_LEARNING_PROGRAMS = 'UPDATE_CATEGORIES_LEARNING_PROGRAMS',
  DELETE_CATEGORIES_LEARNING_PROGRAMS = 'DELETE_CATEGORIES_LEARNING_PROGRAMS'
}

export enum CategoriesBlogsPermissionsEnum {
  READ_CATEGORIES_BLOGS = 'READ_CATEGORIES_BLOGS',
  CREATE_CATEGORIES_BLOGS = 'CREATE_CATEGORIES_BLOGS',
  UPDATE_CATEGORIES_BLOGS = 'UPDATE_CATEGORIES_BLOGS',
  DELETE_CATEGORIES_BLOGS = 'DELETE_CATEGORIES_BLOGS'
}

export enum TagsLearningProgramsPermissionsEnum {
  READ_TAGS_LEARNING_PROGRAMS = 'READ_TAGS_LEARNING_PROGRAMS',
  CREATE_TAGS_LEARNING_PROGRAMS = 'CREATE_TAGS_LEARNING_PROGRAMS',
  UPDATE_TAGS_LEARNING_PROGRAMS = 'UPDATE_TAGS_LEARNING_PROGRAMS',
  DELETE_TAGS_LEARNING_PROGRAMS = 'DELETE_TAGS_LEARNING_PROGRAMS'
}

export enum ToolPermissionEnum {
  CREATE_TOOL = 'CREATE_TOOL',
  UPDATE_TOOL = 'UPDATE_TOOL',
  DELETE_TOOL = 'DELETE_TOOL',
  READ_TOOL = 'READ_TOOL'
}

export enum LecturerSpecsPermissionsEnum {
  READ_LECTURER_SPECS = 'READ_LECTURER_SPECS',
  CREATE_LECTURER_SPECS = 'CREATE_LECTURER_SPECS',
  UPDATE_LECTURER_SPECS = 'UPDATE_LECTURER_SPECS',
  DELETE_LECTURER_SPECS = 'DELETE_LECTURER_SPECS',
  EXPORT_CSV_LECTURER_SPECS = 'EXPORT_CSV_LECTURER_SPECS'
}
//---------------------------------------------------------------------

export enum SecurityGroupPermissionsEnum {
  READ_SECURITY_GROUPS = 'READ_SECURITY_GROUPS',
  UPDATE_SECURITY_GROUPS = 'UPDATE_SECURITY_GROUPS',
  CREATE_SECURITY_GROUPS = 'CREATE_SECURITY_GROUPS',
  DELETE_SECURITY_GROUPS = 'DELETE_SECURITY_GROUPS',
  ASSIGN_SECURITY_GROUPS_TO_USERS = 'ASSIGN_SECURITY_GROUPS_TO_USERS',
  UN_ASSIGN_SECURITY_GROUPS_TO_USERS = 'UN_ASSIGN_SECURITY_GROUPS_TO_USERS'
}

export enum NotificationPermissionsEnum {
  SEND_NOTIFICATIONS = 'SEND_NOTIFICATIONS'
}

export enum AppConfigurationPermissionsEnum {
  READ_APP_CONFIGURATION = 'READ_APP_CONFIGURATION',
  UPDATE_APP_CONFIGURATION = 'UPDATE_APP_CONFIGURATION',
  CREATE_APP_CONFIGURATION = 'CREATE_APP_CONFIGURATION'
}

export enum LecturerRequestPermissionsEnum {
  READ_LECTURER_REQUEST = 'READ_LECTURER_REQUEST',
  UPDATE_LECTURER_REQUEST = 'UPDATE_LECTURER_REQUEST',
  DELETE_LECTURER_REQUEST = 'DELETE_LECTURER_REQUEST'
}

export enum FieldOfTrainingPermissionEnum {
  READ_FIELD_OF_TRAINING = 'READ_FIELD_OF_TRAINING',
  UPDATE_FIELD_OF_TRAINING = 'UPDATE_FIELD_OF_TRAINING',
  CREATE_FIELD_OF_TRAINING = 'CREATE_FIELD_OF_TRAINING',
  DELETE_FIELD_OF_TRAINING = 'DELETE_FIELD_OF_TRAINING'
}

export enum JobTitlePermissionEnum {
  READ_JOB_TITLE = 'READ_JOB_TITLE',
  UPDATE_JOB_TITLE = 'UPDATE_JOB_TITLE',
  CREATE_JOB_TITLE = 'CREATE_JOB_TITLE',
  DELETE_JOB_TITLE = 'DELETE_JOB_TITLE'
}

export enum SkillPermissionEnum {
  CREATE_SKILL = 'CREATE_SKILL',
  UPDATE_SKILL = 'UPDATE_SKILL',
  DELETE_SKILL = 'DELETE_SKILL',
  READ_SKILL = 'READ_SKILL'
}

export enum CategoryPermissionEnum {
  CREATE_CATEGORY = 'CREATE_CATEGORY',
  UPDATE_CATEGORY = 'UPDATE_CATEGORY',
  DELETE_CATEGORY = 'DELETE_CATEGORY',
  READ_CATEGORY = 'READ_CATEGORY'
}

export enum SearchKeywordPermissionEnum {
  CREATE_SEARCH_KEYWORD = 'CREATE_SEARCH_KEYWORD',
  UPDATE_SEARCH_KEYWORD = 'UPDATE_SEARCH_KEYWORD',
  DELETE_SEARCH_KEYWORD = 'DELETE_SEARCH_KEYWORD'
}

export const permissions = {
  users: Object.keys(UserPermissionsEnum),
  securityGroups: Object.keys(SecurityGroupPermissionsEnum),
  notifications: Object.keys(NotificationPermissionsEnum),
  appConfigurations: Object.keys(AppConfigurationPermissionsEnum),
  contactMessages: Object.keys(ContactMessagePermissionsEnum),
  faqs: Object.keys(FaqPermissionsEnum),
  lecturerRequest: Object.keys(LecturerRequestPermissionsEnum),
  lecturer: Object.keys(LecturerPermissionEnum),
  fieldOfTraining: Object.keys(FieldOfTrainingPermissionEnum),
  jobTitle: Object.keys(JobTitlePermissionEnum),
  tools: Object.keys(ToolPermissionEnum),
  categoriesLearningPrograms: Object.keys(
    CategoriesLearningProgramsPermissionsEnum
  ),
  categoriesBlogs: Object.keys(CategoriesBlogsPermissionsEnum),
  skills: Object.keys(SkillPermissionEnum),
  blogs: Object.keys(BlogPermissionsEnum),
  tagsLearningPrograms: Object.keys(TagsLearningProgramsPermissionsEnum),
  administrators: Object.keys(AdministratorPermissionsEnum),
  transactions: Object.keys(TransactionPermissionsEnum),
  payouts: Object.keys(PayoutPermissionsEnum),
  coupons: Object.keys(CouponPermissionsEnum),
  reports: Object.keys(ReportPermissionsEnum),
  analytics: Object.keys(AnalyticsPermissionsEnum),
  courses: Object.keys(CoursePermissionsEnum),
  workshops: Object.keys(WorkshopPermissionsEnum),
  diplomas: Object.keys(DiplomaPermissionsEnum),
  emails: Object.keys(EmailsPermissionsEnum),
  legalContents: Object.keys(LegalContentPermissionsEnum),
  inbox: Object.keys(InboxPermissionsEnum),
  roles: Object.keys(RolesPermissionsEnum),
  lecturerSpecs: Object.keys(LecturerSpecsPermissionsEnum),
  categories: Object.keys(CategoryPermissionEnum),
  blogTags: Object.keys(BlogTagsPermissionEnum),
  searchKeywords: Object.keys(SearchKeywordPermissionEnum)
};

export function getGroupedPermissions(): PermissionsGroups[] {
  let returnedPermissions: PermissionsGroups[] = [];
  let permissionGroup: PermissionsGroups;
  for (let key in permissions) {
    permissionGroup = {
      groupName: key,
      permissions: permissions[key]
    };
    returnedPermissions.push(permissionGroup);
  }
  return returnedPermissions;
}

export function getAllPermissions(): string[] {
  return Object.values(permissions).reduce((total, row) => {
    total.push(...row);
    return total;
  }, []);
}
