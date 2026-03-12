import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  manualPaginator,
  paginate
} from '@src/_common/paginator/paginator.service';
import { getColumnEnum } from '@src/_common/utils/columnEnum';
import { Cart } from '@src/cart/models/cart.model';
import { Purchase } from '@src/cart/models/purchase.model';
import { ContactMessage } from '@src/contact-message/models/contact-message.model';
import { Course } from '@src/course/models/course.model';
import { Lesson } from '@src/course/models/lesson.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { UserLessonProgress } from '@src/course/models/user-lesson-progress.model';
import { NotificationUserStatus } from '@src/notification/models/notification-user-status.model';
import { Notification } from '@src/notification/models/notification.model';
import { NotificationManagerEnum } from '@src/notification/notification.enum';
import { NotificationManager } from '@src/notification/notification.type';
import { Transaction } from '@src/payment/models/transaction.model';
import { ContentReport } from '@src/report/models/report.model';
import { SecurityGroup } from '@src/security-group/security-group.model';
import {
  AllowNull,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from 'sequelize-typescript';
import { Timestamp } from '../../_common/graphql/timestamp.scalar';
import { CommentLikes } from '../../comment/models/comment-like.model';
import { Comment } from '../../comment/models/comment.model';
import { Lecturer } from '../../lecturer/models/lecturer.model';
import { UserSession } from '../../user-sessions/user-sessions.model';
import { UserVerificationCode } from '../../user-verification-code/user-verification-code.model';
import { LangEnum, UserRoleEnum } from '../user.enum';
// import { UserCompletion } from '@src/course/models/user-completion.model';
import { Diploma } from '@src/diploma/models/diploma.model';
import { FcmTokensType } from '../user.type';
import { Op } from 'sequelize';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { slugify } from 'transliteration';
import { Blog } from '@src/blogs/blog/models/blog.model';

@Table({
  timestamps: true,
  tableName: 'Users',
  indexes: [
    { name: 'idx_users_code', fields: ['code'] },
    { name: 'idx_users_created_at', fields: ['createdAt'] },
    { name: 'idx_users_role', fields: ['role'] },
    { name: 'idx_users_email', fields: ['email'], unique: true },
    { name: 'idx_users_last_active_at', fields: ['lastActiveAt'] },
    {
      name: 'idx_users_role_email_createdat',
      fields: ['role', 'email', 'createdAt']
    }
  ]
})
@ObjectType()
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  @Field(() => ID, { nullable: true })
  id: string;

  @AllowNull(false)
  @Column
  @Field()
  arFullName: string;

  @AllowNull(false)
  @Column
  @Field()
  enFullName: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  firstName?: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  lastName?: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  arFirstName?: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  arLastName?: string;

  @Column({ type: DataType.STRING })
  @Field({ nullable: true })
  code: string;

  @Unique
  @AllowNull(true)
  @Column({
    set(val: string) {
      val && typeof val === 'string' ?
        (this as any).setDataValue('email', val.toLowerCase())
      : (this as any).setDataValue('email', val);
    }
  })
  @Field({ nullable: true })
  email?: string;

  @AllowNull(true)
  @Column({
    set(val: string) {
      val && typeof val === 'string' ?
        (this as any).setDataValue('unverifiedEmail', val.toLowerCase())
      : (this as any).setDataValue('unverifiedEmail', val);
    }
  })
  @Field({ nullable: true })
  unverifiedEmail?: string;

  @AllowNull(true)
  @Column
  @Field({ nullable: true })
  phone: string;

  @AllowNull(true)
  @Column
  password: string;

  @Default(UserRoleEnum.USER)
  @AllowNull(false)
  @Column({ type: getColumnEnum(UserRoleEnum) })
  @Field(() => UserRoleEnum, { nullable: true })
  role: UserRoleEnum;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  @Field({ nullable: true })
  profilePicture?: string;

  @Default(false)
  @AllowNull(false)
  @Column
  @Field()
  isBlocked: boolean;

  @Default(false)
  @AllowNull(false)
  @Column
  @Field()
  isDeleted: boolean;

  @Default(LangEnum.EN)
  @AllowNull(false)
  @Column({ type: getColumnEnum(LangEnum) })
  @Field(() => LangEnum)
  favLang: LangEnum;

  @AllowNull(true)
  @ForeignKey(() => SecurityGroup)
  @Column({ type: DataType.UUID, onDelete: 'SET NULL', onUpdate: 'SET NULL' })
  securityGroupId?: string;

  @BelongsTo(() => SecurityGroup)
  @Field(() => SecurityGroup, { nullable: true })
  securityGroup?: SecurityGroup;

  @HasMany(() => UserSession)
  userSessions?: UserSession[];

  @HasMany(() => UserVerificationCode)
  userVerificationCodes?: UserVerificationCode[];

  @BelongsToMany(() => Notification, () => NotificationUserStatus)
  notifications?: Array<
    Notification & { NotificationUserStatus: NotificationUserStatus }
  >;

  @Default(
    Object.keys(NotificationManagerEnum).reduce((total, k) => {
      total[k] = true;
      return total;
    }, {})
  )
  @AllowNull(false)
  @Column({ type: DataType.JSONB })
  @Field(() => NotificationManager)
  notificationManager: NotificationManager;

  @Field({ nullable: true })
  token?: string;

  @Field(() => Timestamp, { nullable: true })
  @Column({ type: DataType.DATE })
  lastActiveAt: Date | number;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;

  @AllowNull(true)
  @Column
  nationality: string;

  @AllowNull(true)
  @Column
  country: string;

  @AllowNull(true)
  @Column({ type: DataType.UUID })
  passwordResetSessionId: string;

  @HasOne(() => Lecturer, 'userId')
  lecturer?: Lecturer;

  @BelongsToMany(() => Course, () => UsersAssignment)
  assignedCourses: Course[];

  @BelongsToMany(() => Lesson, () => UserLessonProgress)
  lessons: Lesson[];

  @HasMany(() => Comment, { foreignKey: 'userId', as: 'comments' })
  comments: Comment[];

  @BelongsToMany(() => Comment, () => CommentLikes)
  likedComments: Comment[];

  @HasMany(() => Transaction, { foreignKey: 'userId', as: 'transactions' })
  transactions: Transaction[];

  @Field(() => Date)
  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  passwordUpdatedAt: Date;

  @ForeignKey(() => Cart)
  @Column({ type: DataType.UUID, onDelete: 'CASCADE' })
  cartId?: string;

  @Field(() => Cart, { nullable: true })
  @HasOne(() => Cart, 'userId')
  cart?: Cart;

  @HasMany(() => Purchase, 'userId')
  purchases?: [Purchase];

  @BelongsToMany(() => Notification, () => NotificationUserStatus)
  @Field(() => [Notification], { nullable: true })
  siteNotifications?: Notification[];

  @HasMany(() => ContactMessage, { foreignKey: 'userId' })
  contactMessages: ContactMessage[];

  @HasMany(() => ContentReport, { foreignKey: 'userId' })
  contentReports: ContentReport[];

  @Column({
    type: DataType.JSONB,
    defaultValue: { android: [], ios: [], desktop: [] }
  })
  fcmTokens: FcmTokensType;

  static async paginate(
    filter = {},
    sort = '-createdAt',
    page = 0,
    limit = 15,
    include: any = []
  ) {
    return paginate<User>(this, filter, sort, page, limit, include);
  }

  static paginateManually(data: User[], page = 0, limit = 15) {
    return manualPaginator<User>(data, {}, '-createdAt', page, limit);
  }

  @Column({ type: DataType.STRING, defaultValue: null })
  @Field(() => String, { nullable: true })
  slug?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  @Field(() => Boolean)
  requireChangePassword: boolean;

  @BeforeUpdate
  @BeforeCreate
  static manipulate_PasswordUpdatedAt(user: User) {
    if (user.password && user.changed('password')) {
      user.passwordUpdatedAt = new Date();
    }
  }

  @BeforeCreate
  // @BeforeUpdate
  static async generateSlug(instance: User) {
    if (
      instance.role === UserRoleEnum.LECTURER &&
      (instance.changed('enFullName') || !instance.slug)
    ) {
      let baseSlug = slugify(instance.enFullName, {
        lowercase: true
      });

      let uniqueSlug = baseSlug;
      let counter = 1;

      while (
        await User.findOne({
          where: { slug: uniqueSlug, id: { [Op.ne]: instance.id } }
        })
      ) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      instance.slug = uniqueSlug;
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async uniqueUserName(instance: User) {
    if (instance.enFullName || instance.arFullName) {
      const conditions: any[] = [];

      if (instance.enFullName) {
        conditions.push({ enFullName: instance.enFullName });
      }

      if (
        instance.arFullName &&
        instance.arFullName !== 'undefined undefined'
      ) {
        conditions.push({ arFullName: instance.arFullName });
      }

      if (conditions.length > 0 && instance.role === UserRoleEnum.LECTURER) {
        const existingUser = await User.findOne({
          where: {
            role: UserRoleEnum.LECTURER,
            [Op.or]: conditions,
            id: { [Op.ne]: instance.id }
          }
        });

        if (existingUser) {
          throw new BaseHttpException(ErrorCodeEnum.LECTURER_NAME_EXISTS);
        }
      }
    }
  }
}
