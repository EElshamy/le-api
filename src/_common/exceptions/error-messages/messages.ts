import { IErrorMessage } from '../error-messages-interface';

export const enErrorMessage: IErrorMessage = {
  PERMISSION_DENIED: 'PERMISSION DENIED',
  UNAUTHORIZED: 'Unauthorized',
  USER_DOES_NOT_EXIST: 'User does not exist',
  EMAIL_ALREADY_EXISTS:
    'An account with this Email already exists please try to sign in instead',
  PHONE_ALREADY_EXISTS:
    'An account with this phone already exists please try another one',
  BLOCKED_USER:
    'Your account has been temporarily suspended. If you have any questions or need assistance, please reach out to us via the Contact Us page',
  USER_PHONE_NOT_VERIFIED_YET: 'User phone is not verified yet',
  USER_EMAIL_IS_NOT_VERIFIED_YET: 'User email is not verified yet',
  EMAIL_DOESNT_BELONG_TO_USER:
    'The email you entered is associated with an instructor account',
  EMAIL_DOESNT_EXIST:
    'The email address you entered is not associated with any account. To continue with this email, please sign up instead',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  NO_VERIFICATION_FOR_EMAIL:
    'Sending verification code for this email is not allowed for this use case',
  OLD_PASSWORD:
    'Your New password cannot be the same as your old password please try another one',
  WRONG_PASSWORD: 'Your current password is incorrect',
  PROVIDE_PASSWORD_BEFORE_EMAIL_CHANGE:
    'You must set a password first, to be able to change your email',
  SAME_OLD_EMAIL: 'The email you entered is already yours!!',
  INCORRECT_EMAIL_OR_PASSWORD: 'Incorrect email or password',
  NO_PENDING_EMAIL_UPDATE: 'No pending email update',
  CONFIRM_PASSWORD_DOESN_T_MATCH: 'Confirm password does not match',
  NO_PASSWORD:
    'This account was created using a Social login please login with it instead',
  INVALID_PASSWORD: 'Invalid Password',
  INVALID_EMAIL: 'Invalid email',
  INVALID_PHONE_NUMBER: 'phone must be a phone number',
  INVALID_VERIFICATION_CODE: 'Invalid OTP, Please try again',
  CONFIGURATION_SHOULD_HAS_UNIQUE_KEY: 'Configuration should has unique key',
  CONFIGURATION_NOT_EXISTS: 'This Configuration does not exists',
  SECURITY_GROUP_NAME_ALREADY_EXISTS:
    'Security group with a same name already exists',
  SECURITY_GROUP_DOES_NOT_EXIST: 'Security group does not exist',
  CANT_DELETE_SUPER_ADMIN_GROUP: 'Super admin group should not be deleted',
  ACCOUNT_EXISTS: 'Account Already Exists',
  SOCIAL_ACCOUNT_EXISTS:
    'another account for the same provider already exists, try logging in instead',
  SOCIAL_ACCOUNT_DOESNT_EXIST: 'Social account does not exist',
  MERGE_UNAUTHORIZED: 'Merging the account is not allowed',
  INVALID_PLATFORM: 'Apple login have to be submitted via IOS platform',
  DISCONNECTION_FAILED:
    'To disconnect this account please link another one first or set a password',
  UNSUPPORTED_PROVIDER:
    "The social provider your're trying to use is not currently supported",
  INVALID_PROVIDER_DATA: 'Invalid provider data',
  NOTIFICATION_DOES_NOT_EXIST: 'Notification does not exist',
  UNKNOWN_ERROR: 'an unknown error occurred',
  BANK_INFORMATION_DOES_NOT_EXIST: 'Bank information does not exist',
  CONTACT_MESSAGE_NOT_EXIST: 'Contact message not exist',
  FAQ_DOES_NOT_EXIST: 'Faq does not exist',
  PAYMENT_ERROR: 'Payment error',
  STORED_PAYMENT_METHOD_NOT_EXIST: 'Stored payment method does not exist',
  INVALID_NAME: 'Name should only contain alphabetic charachters',

  OTP_RESEND_LIMIT: "You've exceeded maximum allowed times to send otp",
  SLOW_DOWN: 'Please wait before sending another request',
  OTP_ENTERING_ATTEMPTS_LIMIT:
    "You've exceeded maximum allowed invalid attempts",
  SAME_PROVIDER_CONNECTED:
    'There is already another provider of the same type linked to the account, please unlink it first',
  CHOOSE_ANOTHER_EMAIL: 'An account with this Email already exists',
  ERROR_VALIDATING_USER_INFO:
    'An error has occurred while trying to fetch user information',

  USER_DELETED: 'User has been deleted.',
  JOB_TITLE_DOES_NOT_EXIST: 'Job title does not exist.',
  ALLOWED_ARABIC_ONLY: 'Only Arabic characters are allowed.',
  ALLOWED_ENGLISH_ONLY: 'Only English characters are allowed.',
  FIELD_OF_TRAINING_DOES_NOT_EXIST: 'Field of training does not exist.',
  INVALID_PHONE: 'Invalid phone number.',
  LECTURER_REQUEST_DOES_NOT_EXIST: 'Lecturer request does not exist.',
  REQUEST_ALREADY_RESOLVED: 'Request has already been approved.',
  LECTURER_PASSWORD_ALREADY_SET: 'Lecturer password has already been set.',
  LECTURER_NOT_APPROVED: 'Lecturer is not approved yet.',
  PASSWORD_RESET_LINK_EXPIRED: 'Password reset link has expired.',
  LECTURER_PROFILE_ALREADY_COMPLETED:
    'Lecturer profile has already been completed.',
  PASSWORD_NOT_SET: 'Password has not been set.',
  LECTURER_DOESNT_EXIST: 'Lecturer does not exist.',
  CANNOT_EDIT_REQUEST: 'Cannot edit request After being approved.',
  INVALID_INPUT: 'Invalid input.',
  CANNOT_CHANGE_PASSWORD: "Lecturer hasn't set a password yet to be changed.",
  CANNOT_RESUBMIT_BANNED_EMAIL:
    'Cannot register, your email has been banned already.',
  JOB_TITLE_USED: "Can't delete Job title as it is already in use.",
  FIELD_OF_TRAINING_USED:
    "Can't delete Field of training as it is already in use.",
  JOB_TITLE_IS_NOT_ACTIVE: 'Job title is not active.',
  CANNOT_RESUBMIT_BANNED_PHONE:
    'Cannot register, your phone has been banned already.',
  URL_CANNOT_CONTAIN_THE_DOMAIN: 'URL cannot contain the specified domain.',
  INVALID_LINKEDIN_URL: 'Invalid LinkedIn URL.',
  INVALID_FACEBOOK_URL: 'Invalid Facebook URL.',
  LECTURER_JOB_TITLE_IS_NOT_SET: 'Lecturer job title is not set.',
  FIELD_OF_TRAINING_IS_NOT_SET: 'Field of training is not set.',
  EMAIL_BELONGS_TO_LECTURER:
    'The email belongs to a lecturer account, try again with a user email',
  EMAIL_BELONGS_TO_USER:
    'The email belongs to a user account, try again with a user email',
  INVALID_VODAFONE_CASH_NUMBER: 'Invalid vodafone cash number',
  LECTURER_BLOCKED:
    'Cannot change lecturer request status, lecturer is blocked',
  TOOL_DOESNT_EXIST: 'The specified tool does not exist.',
  CANNOT_DELETE_TOOL_WITHOUT_REASSIGN:
    'You cannot delete this tool without reassigning associated tools to another tool first.',
  CANNOT_DELETE_CATEGORY_WITHOUT_REASSIGN:
    'You cannot delete this category without reassigning associated categories to another category first.',
  CATEGORY_DOESNT_EXIST: 'The specified category does not exist.',
  CANNOT_DELETE_SKILL_WITHOUT_REASSIGN:
    'You cannot delete this skills without reassigning associated skillss to another skills first.',
  SKILL_DOESNT_EXIST: 'The specified skill does not exist.',
  LECTURER_PROFILE_NOT_COMPLETED: "The lecturer's profile is not yet complete.",
  DRAFTED_PROGRAM_MUST_INCLUDE_ONE_INPUT:
    'A drafted program must include at least one input.',
  COURSE_DOESNT_EXIST: "course doesn't exist",
  COURSE_NOT_DRAFTED: 'cannot publish non drafted course',
  INVALID_COURSE_OWNER:
    "You're not allowed to interact with this drafted course",
  CANNOT_CHANGE_APPROVAL_STATUS: 'Course approval status cannot be changed',
  CANNOT_REASSIGN_TO_THE_SAME_TOOL: 'Cannot reassign to the same tool.',
  CANNOT_REASSIGN_TO_THE_SAME_SKILL: 'Cannot reassign to the same skill.',
  CANNOT_REASSIGN_TO_THE_SAME_CATEGORY: 'Cannot reassign to the same category.',
  INVALID_DISCOUNT:
    'price after discount cannot be larger than or equal to the original price',
  EXTERNAL_LINK_COURSE:
    'Cannot provide sections when the course is created via external link',
  FAILED_TO_FETCH_CREDENTIALS: 'Failed to fetch vdocipher upload credentials',
  VDOCIPHER_FOLDER_ERROR: 'failed to locate vdocipher folder',
  INVALID_LESSON_INPUT: 'please provide valid lessons input for creation',
  INVALID_SECTIONS_INPUT: 'please provide valid sections input for creation',
  UPDATE_COURSE_NOT_ALLOWED: 'You are not allowed to update this course',
  FAILD_TO_FETCH_PLAYBACK_INFO: 'Failed to fetch vdocipher playback info',
  BLOG_CATEGORY_DOESNT_EXIST: "Blog category doesn't exist",
  BLOG_SLUG_EXISTS: 'the slug is already used for another blog',
  BLOG_TAG_DOESNT_EXIST: "blog tag doesn't exist",
  NOT_ALLOWED: 'either provide id or slug',
  BLOG_NOT_FOUND: "blog doesn't exist",
  COLLECTION_NOT_EXISTS: "collection doesn't exist",
  DELETE_COURSE_NOT_ALLOWED: 'You are not allowed to delete this course',
  VALIDATION_FAILED: 'Validation failed with error : {errors}',
  USER_ALREADY_ASSIGNED_TO_COURSE: 'User is already assigned to this course',
  REVIEW_ALREADY_EXISTS: 'You have already reviewed this course',
  REVIEW_DOESNT_EXIST: 'Review not found',
  CERTIFICATION_ALREADY_EXISTS: 'Certification already exists',
  LESSON_NOT_FOUND: 'Lesson not found',
  COMMENT_NOT_FOUND: 'Comment not found',
  MESSAGE_FORBIDDEN: 'Forbidden message',
  FILE_DOESNT_EXIST: 'File does not exist',
  LESSON_NOT_FOUND_FOR_USER: 'Lesson not found for user',
  USER_ID_REQUIRED: 'User id is required',
  USER_NOT_ASSIGNED_TO_COURSE: 'User is not assigned to this course',
  CERTIFICATION_DOESNT_EXISTS: 'Certification does not exist',
  CART_ALREADY_EXISTS: 'Cart already exists',
  CART_ITEM_ALREADY_EXISTS: 'Cart item already exists',
  CART_NOT_FOUND: 'Cart not found',
  CART_ITEM_DOES_NOT_BELONG_TO_USER: 'Cart item does not belong to user',
  INVALID_USER_ROLE: 'Invalid user role',
  WALLET_NOT_FOUND: 'Wallet not found',
  GENERAL_INVALID_TRANSACTION_STATUS: 'Invalid transaction status',
  INVALID_PAYOUT_WALLET_TRANSITION_STATUS:
    'Invalid transition status for a successful payout only transition allowed is canceled',
  INVALID_PAYOUT_WALLET_TYPE: 'Invalid payout wallet type',
  INVALID_WALLET_TYPE: 'Invalid wallet type',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  TRANSACTION_LOG_NOT_FOUND: 'Transaction log not found',
  COUPON_NOT_FOUND: 'Coupon not found',
  SYLLABUS_SHOULD_NOT_BE_EMPTY: 'Syllabus should not be empty',
  DIPLOMA_DOESNT_EXIST: 'Path does not exist',
  COURSE_NOT_COMPLETED: 'Course not completed',
  DB_TRANSACTION_FAILED: 'Database transaction failed',
  THERE_IS_NO_DRAFTED_DIPLOMA: 'There is no drafted path',
  PLEASE_SELECT_DIPLOMA_LANG: 'Language should not be empty',
  USER_ALREADY_ASSIGNED_TO_DIPLOMA: 'User is already assigned to this path',
  USER_ALREADY_UNASSIGNED_TO_DIPLOMA: 'User is already unassigned to this path',
  WALLETS_NOT_FOUND: 'Wallets not found',
  DATABASE_ERROR: 'Database error',
  COURSE_NOT_ASSIGNED_TO_USER: 'Course not assigned to user',
  CANNOT_CHANGE_PUBLICATION_STATUS: 'Cannot change publication status',
  COURSE_IS_PART_OF_OTHER_DIPLOMAS: 'Course is part of other diplomas',
  USER_NOT_ENROLLED_TO_THIS_DIPLOMA: 'User is not enrolled to this path',
  USER_DIDNT_COMPLETE_THIS_DIPLOMA: "User didn't complete this path",
  USER_DIDNT_COMPLETE_THIS_COURSE: "User didn't complete this course",
  DRAFTED_BLOG_MUST_NOT_BE_EMPTY: 'Drafted blog must not be empty',
  THIS_BLOG_IS_NOT_DRAFTED: 'This blog is not drafted',
  WRONG_CALCS: 'Wrong calculations',
  AT_LEAST_ONE_PROGRAM_MUST_HAVE_PRICE: 'At least one program must have price',
  DIPLOMA_PRICE_SHOULD_BE_LESS_THAN_PROGRAM_PRICE:
    'Path price should be less than program price',
  LEARNING_PROGRAM_DOESNT_EXIST: 'Learning program doesnt exist',
  MISSING_REQUIRED_PARAMS_IN_SITE_NOTIFICATIONS:
    'Missing required params when creating the site notification',
  MISSING_BLOG_FIELDS: 'Missing blog fields',
  TARGET_NOT_FOUND: 'Target not found',
  INVALID_ROLE: 'Invalid role',
  CART_IS_EMPTY: 'Cart is empty',
  ACCESS_DENIED: 'Access denied',
  CHOOSE_ANOTHER_PHONE: 'Please choose another phone number',
  COUPON_INPUT_IS_INVALID: 'Coupon input is invalid',
  CREATING_COLLECTION_ERROR: 'Error while creating collection',
  CREATING_VIDEO_ERROR: 'Error while creating video',
  FETCHING_FILE_FAILED: 'Error while fetching file',
  COUPON_DATE_IS_NOT_VALID: 'Coupon start or end date is not valid',
  COUPON_ALREADY_EXISTS: 'Coupon already exists',
  REPORT_EMAIL_AND_FULLNAME_REQUIRED: 'Please enter your email and full name',
  REPORT_NOT_FOUND: 'Report not found',
  SYSTEM_CONFIG_NOT_EXIST: 'System config does not exist',
  INVALID_COUPON_INPUT: 'Invalid Coupon Input',
  DASHBOARD_EMAIL_NOT_FOUND: 'Dashboard email not found',
  NO_DIPLOMAS_CONTAIN_COURSES_FOR_THIS_LECTURER:
    'no diplomas contain courses for this lecturer',
  ALREADY_ASSIGNED_TO_ALL_COURSES_IN_DIPLOMA:
    'Already assigned to all courses in path',
  PURCHASE_NOT_FOUND: 'Purchase not found',
  COUPON_HAS_NOT_BEEN_SYNCED_WITH_THE_PAYMENT_PROVIDER_YET:
    'coupon has not been synced with the payment provider yet',
  REPORT_ALREADY_EXISTS: 'Report already exists',
  REPORT_SELF: 'You cannot report yourself',
  COUPON_MINIMUM_AMOUNT_NOT_MET: 'Coupon minimum amount not met',
  CANNOT_DELETE_TAG_WITHOUT_REASSIGN:
    'You cannot delete a tag without reassigning it',
  CANNOT_REASSIGN_TO_THE_SAME_TAG: 'You cannot reassign a tag to the same tag',
  COUPON_IS_NOT_ACTIVE: 'Coupon is not active',
  COUPON_NOT_APPLICABLE: 'Coupon is not applicable',
  CART_CHECKOUT_NOT_AVAILABLE: 'Cart checkout is not available',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  TRANSACTION_ALREADY_REFUNDED_OR_CANCELLED:
    'Transaction is already refunded or cancelled',
  ALL_PROGRAMS_PRIVATE:
    'All learning programs in this path are private. To keep the path public, you must update the visibility of all programs to public. Do you want to update them now?',
  SOME_PROGRAMS_PRIVATE:
    'Some learning programs in this path are private. To keep the path public, please update the visibility of all learning programs to public or cancel this change.',
  UNAUTHORIZED_To_EDIT_COMMENT: 'Unauthorized to edit comment',
  COUPON_REDEEMABLE_COUNT_EXCEEDED: 'Coupon redeemable count exceeded',
  TOO_MANY_PROGRAMS: 'You can assign a maximum of 10 programs to the user',
  CANNOT_BLOCK_ADMIN: "You can't ban the admin",
  CANT_DELETE_SECURITY_GROUP: "You can't delete security group",
  CANNOT_DELETE_YOURSELF: "You can't delete yourself",
  INVALID_COURSE_PRICE_FOR_DIPLOMA:
    'This course cannot be updated with the new price because it will incorrectly affect some related diplomas.',
  CANNOT_BAN_YOURSELF: "You can't ban yourself",
  COURSE_MUST_HAVE_LECTURER: 'This course must have a lecturer',
  QUIZ_NOT_FOUND: 'Quiz not found',
  ONLY_ONE_CORRECT_ANSWER_ALLOWED:
    "Only one correct answer is allowed when the question doesn't support multiple selections.",
  MAX_ATTEMPTS_REACHED:
    'You have reached the maximum number of attempts for this quiz',
  LESSON_ORDER_ENFORCED:
    'You must complete the previous lessons before continuing',
  QUIZ_NOT_COMPLETED: 'You must complete the quiz before continuing',
  LESSON_IS_LAST: 'This is the last lesson',
  SECTION_NOT_FOUND: 'Section not found',
  QUIZ_ALREADY_EXISTS: 'Quiz already exists',
  LECTURERS_COMMISSIONS_EXCEED_100_PERCENT:
    'Total commission percentage for lecturers cannot exceed 100%',
  INVALID_LECTURERS_COMMISSIONS:
    'Invalid distribution of lecturers’ commissions. Please review the entered values.',
  ADMINS_ASSIGNED_TO_SECURITY_GROUP:
    'This role cannot be deleted because it is assigned to active admin users. Please remove or reassign these users before deleting the role.',
  INVALID_INSTAGRAM_URL: 'Invalid Instagram URL',
  APP_CHECK_TOKEN_NOT_FOUND: 'App check token not found',
  ARTICLE_LESSON_MUST_HAVE_CONTENT: 'Article lesson must have content',
  VIDEO_LESSON_MUST_HAVE_VIDEO_ID: 'Video lesson must have video id',
  LIVE_SESSION_LESSON_MUST_HAVE_VIDEO_URL:
    'Live session lesson must have video url',
  INVALID_VIDEO_ID: 'Invalid video id format. Video ID must be a valid UUID.',
  SECTION_MUST_HAVE_LESSONS:
    'You cannot create a section without lessons unless it is drafted',
  INVALID_LIVE_SESSION_DATES: 'Invalid live session dates',
  USER_ALREADY_ASSIGNED_TO_DIPLOMA_WITH_THIS_COURSE:
    'The user cannot be removed from this course because they are already enrolled in a path that includes the same course.',
  LECTURER_ASSIGNED_TO_COURSE:
    'This lecturer cannot be banned because they are currently assigned to one or more courses. Please remove them from these courses first.',
  TRANSACTION_CANNOT_BE_REFUNDED: 'Transaction cannot be refunded',
  QUIZ_MUST_HAVE_QUESTIONS: 'Quiz must have at least one question',
  QUESTION_MUST_HAVE_ANSWERS: 'Question must have at least one answer',
  QUESTION_MUST_HAVE_CORRECT_ANSWER:
    'Question must have at least one correct answer',
  QUESTION_ORDER_INVALID: 'Question order is invalid',
  MULTIPLE_ANSWERS_REQUIRE_AT_LEAST_TWO_CORRECT:
    'Multiple answers require at least two correct answers',
  INVALID_ANSWERS: 'Invalid answers',
  CANNOT_TOGGLE_QUIZ_COMPLETION:
    'You cannot change the completion status of quiz.',
  COUPON_NOT_STARTED: 'Coupon is not started',
  COUPON_EXPIRED: 'Coupon is expired',
  ALREADY_LOGGED_IN_FROM_BROWSER:
    'You are already logged in from another browser. Please log out first before logging in again.',
  ALREADY_LOGGED_IN_FROM_MOBILE:
    'Your are already logged in from another device using the application. Please log out first before logging in again.',
  LECTURER_NAME_EXISTS: 'Lecturer name already exists',
  BLOG_TITLE_EXISTS: 'Blog title already exists',
  COURSE_TITLE_EXISTS: 'Course title already exists',
  DIPLOMA_TITLE_EXISTS: 'Path title already exists',
  CATEGORY_NAME_EXISTS: 'Category name already exists',
  CATEGORY_NOT_FOUND: 'Category not found',
  COUPON_REDEEMABLE_COUNT_INVALID: 'Redeemable count cannot be negative',
  COUPON_DATES_REQUIRED: 'Coupon must have both a start date and an end date',
  COUPON_START_AFTER_END: 'Start date cannot be after the end date',
  COUPON_END_IN_PAST: 'End date cannot be in the past',
  COUPON_PERCENTAGE_INVALID: 'Percentage discount must be between 0 and 100',
  COUPON_AMOUNT_INVALID: 'Discount amount cannot be negative',
  COUPON_CANNOT_ACTIVATE_IN_FUTURE:
    'Cannot activate coupon that starts in the future',
  COUPON_APPLICABILITY_IDS_REQUIRED:
    'Applicability criteria requires specific items',
  COUPON_FREE_SHOULD_NOT_HAVE_AMOUNT: 'Free discount should not have an amount',
  COUPON_SHOULD_NOT_START_IN_PAST: 'Coupon cannot start in the past',
  START_DATE_AFTER_END_DATE: 'Start date must be before the end date',
  END_DATE_IN_PAST: 'End date cannot be in the past',
  START_DATE_IN_PAST: 'Start date cannot be in the past',
  MISSING_SESSION_DATES:
    'Both start and end dates are required for the session',
  LECTURER_IS_REQUIRED: 'Lecturer is required',
  PASSWORD_USED_BEFORE: 'Password has been used before',
  PASSWORD_CHANGE_REQUIRED: 'Password must be changed',
  DUPLICATED_LECTURER_IN_COURSE: 'Duplicated lecturer in the the course',
  TOO_MANY_REQUESTS: 'Too many attempts detected. Please try again later.',
  TOO_MANY_REQUESTS_AND_BLOCKED_ONE_HOUR:
    'Too many attempts detected. Requests have been temporarily blocked for one hour. Please try again later.',
  INVALID_TRANSACTION: 'Invalid transaction',
  INVALID_TRANSACTION_AMOUNT: 'Invalid transaction amount',
  INVALID_TRANSACTION_STATE: 'Invalid transaction state',
  INVALID_TRANSACTION_STATE_TRANSITION: 'Invalid transaction state transition',
  INVALID_TRANSACTION_OWNER: 'Invalid transaction owner',
  INVALID_TRANSACTION_TYPE: 'Invalid transaction type',
  ALREADY_CONSUMED_FIREBASE_APP_CHECK: 'Already consumed X-Firebase-AppCheck',
  FAILED_TO_VALIDATE_FIREBASE_APP_CHECK:
    'Failed to validate X-Firebase-AppCheck',
  VAT_PERCENTAGE_SUM_SHOULD_NOT_EXCEED_100:
    'VAT percentage sum should not exceed 100',
  ACCESS_DURATION_NOT_ALLOWED_FOR_PATH_DIPLOMA:
    'Access duration not allowed for paths',
  INVALID_ACCESS_DURATION: 'Invalid access duration',
  INVALID_ACCESS_DURATION_FOR_SUBSCRIPTION_DIPLOMA:
    'Invalid access duration for subscription path',
  SEARCH_KEYWORD_LIMIT_EXCEEDED:
    'Search keyword limit exceeded. Maximum allowed is 4 keywords.',
  SEARCH_KEYWORD_NOT_FOUND: 'Search keyword not found',
  SUPER_ADMIN_ALREADY_EXISTS: 'Super Admin already exists, only one Super Admin is allowed.',
};
