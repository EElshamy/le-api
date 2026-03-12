import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { PaginatorInput } from '@src/_common/paginator/paginator.input';
import {
  PaginationRes,
  SortTypeEnum
} from '@src/_common/paginator/paginator.types';
import { HelperService } from '@src/_common/utils/helper.service';
import { CourseUserFilterEnum } from '@src/course/inputs/course-user-filter.input';
import {
  ReviewStatusEnum,
  userLearningProgramFilterInput
} from '@src/course/inputs/user-learning-program.filter.input';
import * as bcrypt from 'bcryptjs';
import {
  Includeable,
  Op,
  QueryTypes,
  Sequelize,
  WhereOptions
} from 'sequelize';

import { CartService } from '@src/cart/services/cart.service';
import {
  UserLearningProgramSortEnum,
  UserLearningProgramSortInput
} from '@src/course/inputs/user-learning-program.sort.input';
import { UserCourseProgress } from '@src/course/interfaces/course.type';
import { Course } from '@src/course/models/course.model';
import { Lesson } from '@src/course/models/lesson.model';
import { Section } from '@src/course/models/section.model';
import { UsersAssignment } from '@src/course/models/user-assignments.model';
import { PolicyService } from '@src/policy/services/policy.service';
import { Review } from '@src/reviews/review.model';
import { getAllPermissions } from '@src/security-group/security-group-permissions';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { SysConfigService } from '@src/system-configuration/services/sys-config.service';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { ApprovalStatusEnum } from '../../lecturer/enums/lecturer.enum';
import { Lecturer } from '../../lecturer/models/lecturer.model';
import { UserSocialAccount } from '../../social-auth/user-social-account.model';
import { ActiveUsersHistoryService } from '../../user-activity/services/active-users.service';
import { UserSessionService } from '../../user-sessions/user-sessions.service';
import { UserVerificationCode } from '../../user-verification-code/user-verification-code.model';
import { AdministratorsBoardFilter } from '../inputs/administrator-board-filter.input';
import { administratorBoardSort } from '../inputs/administrator-board-sort.input';
import {
  ChangePasswordBoardInput,
  ChangePasswordInput
} from '../inputs/change-password.input';
import { CreateAdministratorBoardInput } from '../inputs/create-administrator.input';
import { CreateUserBoardInput } from '../inputs/create-user-board.input';
import { UpdateAdminProfileInput } from '../inputs/update-admin-profile.input';
import { UpdateAdministratorBoardInput } from '../inputs/update-administrator-board.input';
import { UpdateUserBoardInput } from '../inputs/update-user-board.input';
import {
  UpdatePhone,
  updateProfilePicture,
  UpdateUserProfileInput
} from '../inputs/update-user-profile.input';
import { UserBoardInput, UsersBoardFilter } from '../inputs/users-board.filter';
import { UsersBoardSort } from '../inputs/users-board.sort.input';
import { User } from '../models/user.model';
import { UserTransformer } from '../transformers/user.transformer';
import {
  DeviceEnum,
  UserRoleEnum,
  UserSortEnum,
  UserVerificationCodeUseCaseEnum,
  VerificationCodeDestination
} from '../user.enum';
import { UserByEmailBasedOnUseCaseOrErrorInput } from '../user.interface';
import { NotificationUserStatus } from '@src/notification/models/notification-user-status.model';
import { Cart } from '@src/cart/models/cart.model';
import { CartItem } from '@src/cart/models/cart-item.model';
import { Notification } from '@src/notification/models/notification.model';
import { ru } from '@faker-js/faker';
import { UpdatedAt } from 'sequelize-typescript';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { UploaderService } from '@src/_common/uploader/uploader.service';
import { UserPasswordHistory } from '../models/user-password-history.model';

@Injectable()
export class UserService {
  constructor(
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.UserSocialAccountsRepository)
    private readonly userSocialAccountsRepo: IRepository<UserSocialAccount>,
    @Inject(Repositories.UsersAssignmentsRepository)
    private readonly userAssignedCoursesRepo: IRepository<UsersAssignment>,
    @Inject(Repositories.CoursesRepository)
    private readonly courseRepo: IRepository<Course>,
    private readonly userTransformer: UserTransformer,
    @Inject(Repositories.SecurityGroupsRepository)
    private readonly securityGroupRepo: IRepository<SecurityGroup>,
    @Inject(Repositories.ReviewsRepository)
    private readonly reviewRepo: IRepository<Review>,
    @Inject(Repositories.NotificationUserStatusesRepository)
    private readonly notificationUserStatusRepo: IRepository<NotificationUserStatus>,
    @Inject(Repositories.CourseLecturersRepository)
    private readonly courseLecturersRepo: IRepository<CourseLecturer>,
    @Inject(Repositories.LecturersRepository)
    private readonly lecturerRepo: IRepository<Lecturer>,
    @Inject(Repositories.UserPasswordHistoriesRepository)
    private readonly userPasswordHistoryRepo: IRepository<UserPasswordHistory>,
    @Inject(Repositories.CartsRepository)
    private readonly cartsRepo: IRepository<Cart>,
    private readonly config: ConfigService,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly userSessionService: UserSessionService,
    private readonly activeUsersHistoryService: ActiveUsersHistoryService,
    private readonly helperService: HelperService,
    private readonly cartService: CartService,
    private readonly systemConfigService: SysConfigService,
    private readonly policyService: PolicyService,
    private readonly uploaderService: UploaderService
  ) {}

  async usersBoard(
    currenrUserId: string,
    filter: UsersBoardFilter = {},
    paginate: PaginatorInput = {},
    sortBy: UsersBoardSort = {
      sortBy: UserSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ): Promise<PaginationRes<User>> {
    return await this.userRepo.findPaginated(
      ...this.userTransformer.usersBoardTransformer(
        currenrUserId,
        filter,
        paginate,
        sortBy
      ),
      filter.notAssignedToCourseId ?
        [
          {
            model: Course,
            where: {
              id: filter.notAssignedToCourseId
            },
            required: false,
            as: 'assignedCourses'
          }
        ]
      : [],
      undefined,
      false
    );
  }

  async administratorsBoard(
    currenrUserId: string,
    filter: AdministratorsBoardFilter = {},
    paginate: PaginatorInput = {},
    sortBy: administratorBoardSort = {
      sortBy: UserSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ): Promise<PaginationRes<User>> {
    return await this.userRepo.findPaginated(
      {
        role: UserRoleEnum.ADMIN,
        id: { [Op.ne]: currenrUserId },
        ...(filter?.securityGroupId && {
          securityGroupId: filter.securityGroupId
        }),
        ...(filter.searchKey && {
          [Op.or]: [
            {
              arFullName: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            },
            {
              email: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            },
            {
              code: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            }
          ]
        })
      },
      [[sortBy.sortBy, sortBy.sortType]],
      paginate.page,
      paginate.limit,
      [{ model: SecurityGroup }]
    );
  }

  async userOrError(input: UserBoardInput): Promise<User> {
    if (!input.code && !input.userId)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    const user = await this.userRepo.findOne({
      ...(input.userId && { id: input.userId }),
      ...(input.code && { code: input.code }),
      role: UserRoleEnum.USER
    });
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return user;
  }

  async administratorOrError(input: UserBoardInput): Promise<User> {
    if (!input.code && !input.userId)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    const user = await this.userRepo.findOne({
      ...(input.userId && { id: input.userId }),
      ...(input.code && { code: input.code }),
      role: UserRoleEnum.ADMIN
    });
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    return user;
  }

  private validateUserStatus(user: User): void {
    if (user.isBlocked) throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);
    if (user.isDeleted) throw new BaseHttpException(ErrorCodeEnum.USER_DELETED);
  }
  async createUserBoard(input: CreateUserBoardInput): Promise<User> {
    await this.deleteRejectedLecturersWithTheSameEmailOrPhone(input.email);
    await this.errorIfUserWithEmailExists(input.email);
    await this.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);
    await this.errorIfUserWithPhoneExistsForRegisteration(input?.phone);
    await this.deleteDuplicatedUsersAtPhonesIfEmailNotVerifiedYet(input.phone);

    const user = await this.userRepo.createOne(
      await this.userTransformer.createUserBoardTransformer(input)
    );

    if (input.profilePicture) {
      await this.uploaderService.setUploadedFilesReferences(
        [input.profilePicture],
        'User',
        'profilePicture',
        user.id
      );
    }

    await this.userPasswordHistoryRepo.createOne({
      userId: user.id,
      password: user.password,
      changedAt: new Date()
    });

    await this.cartService.createCart(user);

    return user;
  }

  async updateUserBoard(input: UpdateUserBoardInput): Promise<User> {
    const user = await this.userOrError({ userId: input.userId });
    this.validateUserStatus(user);

    if (input.email) {
      await this.errorIfOtherUserHasSameVerifiedEmail(
        input.email,
        input.userId
      );
      await this.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);
    }

    if (input.phone) {
      await this.errorIfUserWithPhoneExistsForRegisteration(
        input.phone,
        input.userId
      );
      await this.deleteDuplicatedUsersAtPhonesIfEmailNotVerifiedYet(
        input.phone
      );
    }

    return await this.sequelize.transaction(async transaction => {
      // handle profile picture if provided
      if (input.profilePicture) {
        await this.uploaderService.setUploadedFilesReferences(
          [input.profilePicture],
          'User',
          'profilePicture',
          user.id,
          transaction
        );

        await this.uploaderService.removeOldFilesReferences(
          [input.profilePicture],
          [user.profilePicture],
          transaction
        );
      }

      const updatedUser = await this.userRepo.updateOneFromExistingModel(
        user,
        await this.userTransformer.updateUserBoardTransformer(input, user),
        transaction
      );

      return updatedUser;
    });
  }

  async updateAdministratorBoard(input: UpdateAdministratorBoardInput) {
    const user = await this.administratorOrError({ userId: input.userId });

    this.validateUserStatus(user);

    if (input.email) {
      await this.errorIfOtherUserHasSameVerifiedEmail(
        input.email,
        input.userId
      );
      await this.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);
    }

    if (input.securityGroupId) {
      await this.ensureSingleSuperAdmin(input.securityGroupId, input.userId);
    }

    return await this.userRepo.updateOneFromExistingModel(
      user,
      await this.userTransformer.updateAdministratorBoardTransformer(
        input,
        user
      )
    );
  }

  async createAdministratorBoard(input: CreateAdministratorBoardInput) {
    await this.errorIfUserWithEmailExists(input.email);
    await this.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);

    await this.ensureSingleSuperAdmin(input.securityGroupId);

    const user = await this.userRepo.createOne({
      ...(await this.userTransformer.createUserBoardTransformer(input)),
      role: UserRoleEnum.ADMIN,
      requireChangePassword: true,
      securityGroupId: input.securityGroupId
    });

    await this.userPasswordHistoryRepo.createOne({
      userId: user.id,
      password: user.password,
      changedAt: new Date()
    });

    return user;
  }

  async toggleBlockUserBoard(userToBlockId: string, currentUserId: string) {
    let user = await this.userRepo.findOne({ id: userToBlockId });
    let currentUserIsSuperAdmin = !!(await this.userRepo.findOne(
      { id: currentUserId },
      [
        {
          model: SecurityGroup,
          required: true,
          where: {
            groupName: 'SuperAdmin',
            isActive: true,
            deletedAt: null
          }
        }
      ]
    ));

    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    if (user.isDeleted) throw new BaseHttpException(ErrorCodeEnum.USER_DELETED);
    if (user.role === UserRoleEnum.ADMIN && !currentUserIsSuperAdmin) {
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_BLOCK_ADMIN);
    }
    if (user.id === currentUserId)
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_BAN_YOURSELF);

    // ✅ Check if lecturer exists in CourseLecturers before blocking

    const lecturer = await this.lecturerRepo.findOne({
      userId: user.id
    });
    if (user.role === UserRoleEnum.LECTURER && !user.isBlocked) {
      const isLecturerAssigned = await this.courseLecturersRepo.findOne({
        lecturerId: lecturer.id
      });

      if (isLecturerAssigned) {
        throw new BaseHttpException(ErrorCodeEnum.LECTURER_ASSIGNED_TO_COURSE);
      }
    }

    return await this.sequelize.transaction(async transaction => {
      if (!user.isBlocked)
        await this.userSessionService.deactivateUserSessions(
          userToBlockId,
          null,
          transaction
        );

      user = await this.userRepo.updateOneFromExistingModel(
        user,
        {
          isBlocked: !user.isBlocked
        },
        transaction
      );

      return true;
    });
  }

  async deleteUserBoard(userId: string) {
    const user = await this.userRepo.findOne({
      id: userId,
      securityGroupId: null,
      role: UserRoleEnum.USER
    });

    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);

    if (user.isDeleted) throw new BaseHttpException(ErrorCodeEnum.USER_DELETED);
    return await this.deleteUserAccount(userId);
  }

  async deleteAdministratorBoard(userId: string, currentUserId: string) {
    const user = await this.userRepo.findOne({
      id: userId,
      role: UserRoleEnum.ADMIN
    });

    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    if (user.isDeleted) throw new BaseHttpException(ErrorCodeEnum.USER_DELETED);
    if (user.id === currentUserId)
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_DELETE_YOURSELF);

    return await this.deleteUserAccount(userId);
  }

  async deleteUserAccount(userId: string) {
    return await this.sequelize.transaction(async transaction => {
      await this.userRepo.updateAll(
        { id: userId },
        {
          email: null,
          unverifiedEmail: null,
          isDeleted: true
        },
        transaction
      );
      await this.userSessionService.deactivateUserSessions(
        userId,
        null,
        transaction
      );
      await this.userSocialAccountsRepo.deleteAll({ userId }, transaction);

      return true;
    });
  }

  async getValidUserOrError(
    filter: WhereOptions,
    joinedTables?: Includeable[]
  ): Promise<User> {
    const user = await this.userRepo.findOne(filter, joinedTables);
    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    if (user.isBlocked) throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);
    if (user.isDeleted) throw new BaseHttpException(ErrorCodeEnum.USER_DELETED);
    if (!user.email)
      throw new BaseHttpException(ErrorCodeEnum.USER_EMAIL_IS_NOT_VERIFIED_YET);
    return user;
  }

  async getValidUserForLoginOrError(filter: WhereOptions): Promise<User> {
    const user = await this.userRepo.findOne(
      { ...filter, isDeleted: false, isBlocked: false },
      [Lecturer]
    );
    if (!user)
      throw new BaseHttpException(ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD);
    if (user.isBlocked) throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);
    return user;
  }

  async errorIfUserWithEmailExistsForRegisteration(email?: string) {
    if (email && (await this.userRepo.findOne({ email })))
      throw new BaseHttpException(ErrorCodeEnum.EMAIL_ALREADY_EXISTS);
  }
  async errorIfUserWithPhoneExistsForRegisteration(
    phone?: string,
    currentUserId?: string
  ): Promise<void> {
    if (!phone) return;

    const existingUser = await this.userRepo.findOne({ phone });

    if (!existingUser) return;

    if (existingUser.id === currentUserId) return;

    if (existingUser.email) {
      throw new BaseHttpException(ErrorCodeEnum.PHONE_ALREADY_EXISTS);
    }

    await this.userRepo.deleteAll({
      phone,
      email: null
    });
  }

  async errorIfUserWithEmailExists(email?: string) {
    if (email && (await this.userRepo.findOne({ email })))
      throw new BaseHttpException(ErrorCodeEnum.CHOOSE_ANOTHER_EMAIL);
  }
  async errorIfUserWithPhoneExists(phone: string) {
    if (await this.userRepo.findOne({ phone, email: { [Op.ne]: null } }))
      throw new BaseHttpException(ErrorCodeEnum.PHONE_ALREADY_EXISTS);
  }

  async validateIfOtherUserHasEmailOrPhoneAndDeleteDuplicates(
    email: string,
    phone: string,
    currentUserId: string
  ) {
    if (email) {
      await this.deleteDuplicatedUsersAtNotVerifiedEmail(email);
      await this.errorIfOtherUserHasSameVerifiedEmail(email, currentUserId);
    }

    if (phone) {
      await this.deleteDuplicatedUsersAtPhonesIfEmailNotVerifiedYet(phone);
      await this.errorIfOtherUserHasSamePhone(phone, currentUserId);
    }
  }

  async deleteDuplicatedUsersAtPhonesIfEmailNotVerifiedYet(phone?: string) {
    if (phone) {
      await this.userRepo.deleteAll({
        phone: phone,
        email: null,
        isBlocked: false,
        isDeleted: false
      });
    }
  }

  async getUserByVerifiedEmailOrError(email: string): Promise<User> {
    const user = await this.userRepo.findOne({ email }, [UserVerificationCode]);
    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.EMAIL_DOESNT_EXIST);
    }
    return user;
  }

  async deleteDuplicatedUsersAtNotVerifiedEmail(duplicatedEmail: string) {
    await this.userRepo.updateAll(
      { email: { [Op.ne]: null }, unverifiedEmail: duplicatedEmail },
      { unverifiedEmail: null }
    );
    return await this.userRepo.deleteAll({
      email: null,
      unverifiedEmail: duplicatedEmail
    });
  }

  async errorIfOtherUserHasSameVerifiedEmail(
    email: string,
    currentUserId: string
  ) {
    const otherUser = await this.userRepo.findOne({
      email,
      id: { [Op.ne]: currentUserId }
    });
    if (otherUser)
      throw new BaseHttpException(ErrorCodeEnum.CHOOSE_ANOTHER_EMAIL);
  }

  async errorIfOtherUserHasSamePhone(phone: string, currentUserId: string) {
    const otherUser = await this.userRepo.findOne({
      phone,
      id: { [Op.ne]: currentUserId }
    });
    if (otherUser)
      throw new BaseHttpException(ErrorCodeEnum.PHONE_ALREADY_EXISTS);
  }

  async seedAdmin(): Promise<boolean> {
    try {
      const superAdminSecurityGroupId =
        await this.findOrCreateSuperAdminSecurityGroup();

      const appName = this.config.get<string>('APP_NAME') || 'leiaqa';

      const envEmail =
        this.config.get<string>('APP_EMAIL') || `info@${appName}.com`;

      let superAdmin = await this.userRepo.findOne({
        securityGroupId: superAdminSecurityGroupId
      });

      if (!superAdmin) {
        superAdmin = await this.userRepo.createOne({
          firstName: appName,
          lastName: 'admin',
          arFullName: `${appName}_Admin`,
          enFullName: `${appName}_Admin`,
          email: envEmail,
          password: await bcrypt.hash(`${appName}@123456`, 12),
          isBlocked: false,
          role: UserRoleEnum.ADMIN,
          securityGroupId: superAdminSecurityGroupId
        });

        await this.userPasswordHistoryRepo.createOne({
          userId: superAdmin.id,
          password: superAdmin.password,
          changedAt: new Date()
        });
      } else {
        if (superAdmin.email !== envEmail && envEmail) {
          await this.userRepo.updateOne(
            { id: superAdmin.id },
            { email: envEmail }
          );
        }
      }

      await this.systemConfigService.createDefaultSystemConfig({
        email: envEmail,
        vat: 14,
        paymentGatewayVat: 2
      });

      await this.policyService.createDefaultPolicies();

      return true;
    } catch (error) {
      console.error('SEED ADMIN ERROR:', error?.message);
      console.error(error);
      throw error;
    }
  }

  private async findOrCreateSuperAdminSecurityGroup() {
    let superAdminSecurityGroup = await this.securityGroupRepo.findOne({
      groupName: 'SuperAdmin'
    });

    if (!superAdminSecurityGroup) {
      superAdminSecurityGroup = await this.securityGroupRepo.createOne({
        groupName: 'SuperAdmin',
        permissions: getAllPermissions()
      });
    } else {
      superAdminSecurityGroup =
        await this.securityGroupRepo.updateOneFromExistingModel(
          superAdminSecurityGroup,
          { permissions: getAllPermissions() }
        );
    }

    return superAdminSecurityGroup.id;
  }

  async updateUserProfile(
    input: UpdateUserProfileInput,
    currentUserId: string
  ): Promise<User> {
    const user = await this.getValidUserOrError({ id: currentUserId });
    return await this.userRepo.updateOneFromExistingModel(user, {
      ...input,
      ...this.userTransformer.fullNameTransformer(
        input.firstName ?? user.firstName,
        input.lastName ?? user.lastName,
        input.arFirstName ?? user.firstName,
        input.arLastName ?? user.lastName
      )
    });
  }

  async updateAdminProfile(
    input: UpdateAdminProfileInput,
    currentUserId: string
  ): Promise<User> {
    const user = await this.getValidUserOrError({ id: currentUserId });
    return await this.userRepo.updateOneFromExistingModel(user, {
      ...input,
      ...(input.password && {
        password: await bcrypt.hash(input.password, 12)
      }),
      ...this.userTransformer.fullNameTransformer(
        input.firstName ?? user.firstName,
        input.lastName ?? user.lastName
      )
    });
  }

  async changePassword(
    input: ChangePasswordInput,
    currentUserId: string
  ): Promise<User> {
    const user = await this.getValidUserOrError({ id: currentUserId });
    const password = await this.userTransformer.checkPasswordAndHashIt(
      user.password,
      input.oldPassword,
      input.newPassword,
      user.id
    );

    await this.userPasswordHistoryRepo.createOne({
      userId: user.id,
      password
    });
    return await this.userRepo.updateOneFromExistingModel(user, {
      password,
      requireChangePassword: false
    });
  }

  async changePasswordBoard(
    input: ChangePasswordBoardInput,
    currentUserId: string
  ) {
    const user = await this.getValidUserOrError({ id: currentUserId });

    if (user.role === UserRoleEnum.LECTURER && !user.password)
      throw new BaseHttpException(ErrorCodeEnum.PASSWORD_NOT_SET);

    const password = await this.userTransformer.validateOldPasswordAndHashIt(
      user.password,
      input.oldPassword,
      input.newPassword,
      user.id
    );

    await this.userPasswordHistoryRepo.createOne({
      userId: user.id,
      password
    });

    return await this.userRepo.updateOneFromExistingModel(user, {
      password,
      requireChangePassword: false
    });
  }

  private async checkUserWithVerificationCodeExists(email: string) {
    const user = await this.userRepo.findOne(
      {
        [Op.or]: [{ email: email }, { unverifiedEmail: email }],
        role: [UserRoleEnum.LECTURER, UserRoleEnum.USER, UserRoleEnum.ADMIN]
      },
      [{ model: UserVerificationCode, required: false }]
    );

    if (!user) throw new BaseHttpException(ErrorCodeEnum.EMAIL_DOESNT_EXIST);

    return user;
  }

  async userByEmailBasedOnUseCaseOrError(
    input: UserByEmailBasedOnUseCaseOrErrorInput
  ) {
    const user = await this.checkUserWithVerificationCodeExists(input.email);

    if (input.destination)
      this.validateRoleAndUseCase(user.role, input.useCase, input.destination);

    if (
      input.useCase === UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION &&
      user.email
    )
      throw new BaseHttpException(ErrorCodeEnum.EMAIL_ALREADY_VERIFIED);

    if (input.useCase === UserVerificationCodeUseCaseEnum.PASSWORD_RESET)
      this.validateResetPasswordUseCase(user, input);

    if (input.useCase === UserVerificationCodeUseCaseEnum.EMAIL_UPDATE)
      this.validateEmailUpdateUseCase(user, input);

    return user;
  }

  private validateRoleAndUseCase(
    userRole: UserRoleEnum,
    useCase: UserVerificationCodeUseCaseEnum,
    destination: VerificationCodeDestination
  ) {
    if (destination === VerificationCodeDestination.BOARD)
      return this.validateBoardDestination(userRole);
    // if (destination === VerificationCodeDestination.WEBSITE)
    //   return this.validateSiteDestination(userRole, useCase);
  }

  private validateSiteDestination(
    role: UserRoleEnum,
    useCase: UserVerificationCodeUseCaseEnum
  ) {
    if (
      role === UserRoleEnum.LECTURER &&
      useCase !== UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
    )
      throw new BaseHttpException(ErrorCodeEnum.EMAIL_BELONGS_TO_LECTURER);
  }

  private validateBoardDestination(role: UserRoleEnum) {
    if (role === UserRoleEnum.USER)
      throw new BaseHttpException(ErrorCodeEnum.EMAIL_BELONGS_TO_USER);
  }

  private validateResetPasswordUseCase(
    user: User,
    input: UserByEmailBasedOnUseCaseOrErrorInput
  ) {
    if (user.role === UserRoleEnum.LECTURER && !user.password)
      throw new BaseHttpException(ErrorCodeEnum.PASSWORD_NOT_SET);

    if (!user.email)
      throw new BaseHttpException(ErrorCodeEnum.USER_EMAIL_IS_NOT_VERIFIED_YET);

    if (input.email !== user.email)
      throw new BaseHttpException(ErrorCodeEnum.EMAIL_DOESNT_EXIST);
  }

  private validateEmailUpdateUseCase(
    user: User,
    input: UserByEmailBasedOnUseCaseOrErrorInput
  ) {
    if (user.unverifiedEmail !== input.email)
      throw new BaseHttpException(ErrorCodeEnum.NO_VERIFICATION_FOR_EMAIL);

    if (!user.unverifiedEmail)
      throw new BaseHttpException(ErrorCodeEnum.NO_PENDING_EMAIL_UPDATE);

    if (!user.email)
      throw new BaseHttpException(ErrorCodeEnum.USER_EMAIL_IS_NOT_VERIFIED_YET);
  }

  async updateUserActivityStatus(currentUser: User) {
    if (currentUser.role === UserRoleEnum.ADMIN) return;

    if (currentUser.securityGroupId) return;

    const activeAt =
      await this.activeUsersHistoryService.markUserAsActiveForToday(
        currentUser
      );
    if (activeAt)
      await this.userRepo.updateOne(
        { id: currentUser.id },
        { lastActiveAt: new Date() }
      );
  }

  async deleteRejectedLecturersWithTheSameEmailOrPhone(
    email: string,
    phone?: string
  ) {
    const lecturers = await this.userRepo.findAll(
      {
        [Op.or]: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
        role: UserRoleEnum.LECTURER
      },
      [
        {
          model: Lecturer,
          required: true,
          where: { status: ApprovalStatusEnum.REJECTED }
        }
      ],
      null,
      ['id', 'isBlocked', 'email', 'phone']
    );

    if (!lecturers.length) return;

    let lecturerWithTheSameEmail, lecturerWithTheSamePhone;

    lecturers.forEach(lecturer => {
      if (email && lecturer.email === email)
        lecturerWithTheSameEmail = lecturer;
      if (phone && lecturer.phone === phone)
        lecturerWithTheSamePhone = lecturer;
    });

    if (lecturerWithTheSameEmail?.isBlocked)
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_RESUBMIT_BANNED_EMAIL);

    if (lecturerWithTheSamePhone?.isBlocked)
      throw new BaseHttpException(ErrorCodeEnum.CANNOT_RESUBMIT_BANNED_PHONE);

    await this.userRepo.deleteAll({
      id: lecturers.map(lecturer => lecturer.id)
    });
  }

  async getTotalLessonsForCourse(courseId: string): Promise<number> {
    const course = await this.courseRepo.findOne({ id: courseId }, [
      {
        model: Section,
        include: [Lesson]
      }
    ]);

    if (!course) throw new Error('Course not found.');

    const totalLessons = course.courseSections.reduce(
      (sum, section) => sum + section.lessons.length,
      0
    );

    return totalLessons;
  }

  async getUserCourseProgress(
    userId: string,
    courseId: string
  ): Promise<UserCourseProgress> {
    // Get total lessons for the course
    const totalLessons = await this.getTotalLessonsForCourse(courseId);

    // Get completed lessons for the user in this course
    const userCourse = await this.userAssignedCoursesRepo.findOne({
      userId,
      courseId
    });

    const completedLessons = userCourse?.completedLessons || 0;

    return { completedLessons, totalLessons, joinedAt: userCourse?.createdAt };
  }

  async userLearningPrograms(
    userId: string,
    filter: userLearningProgramFilterInput,
    sort: UserLearningProgramSortInput = {
      sortBy: UserLearningProgramSortEnum.joinedAt,
      sortType: SortTypeEnum.DESC
    },
    pagination: PaginatorInput = {}
  ) {
    const { reviewStatus, progress, type, searchKey } = filter || {};

    // Base conditions
    const userCourseConditions: any = { userId };

    if (progress) {
      userCourseConditions.completed =
        progress === CourseUserFilterEnum.COMPLETED;
    }

    // Fetch User Courses (Filtered and Sorted)
    const userCourses = await this.userAssignedCoursesRepo.findAll(
      {
        ...userCourseConditions
      },
      [],
      [[sort.sortBy, sort.sortType]],
      ['courseId']
    );

    const sortedCourseIds = userCourses.map(uc => uc.courseId);

    // Exit early if no assigned courses
    if (!sortedCourseIds.length) {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;

      return {
        items: [],
        meta: { total: 0, page, limit },
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          currentPage: page,
          totalPages: 0,
          totalCount: 0
        }
      };
    }

    // Build course WHERE conditions
    const courseWhere: any = {
      id: { [Op.in]: sortedCourseIds }
    };

    if (type) {
      courseWhere.type = type;
    }

    if (searchKey) {
      courseWhere[Op.or] = [
        { enTitle: { [Op.iLike]: `%${searchKey}%` } },
        { arTitle: { [Op.iLike]: `%${searchKey}%` } },
        Sequelize.where(
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "CourseLecturers" cl
              INNER JOIN "Lecturers" l ON cl."lecturerId" = l."id"
              INNER JOIN "Users" u ON l."userId" = u."id"
              WHERE cl."courseId" = "Course"."id"
                AND (
                  u."enFullName" ILIKE '%${searchKey}%'
                  OR u."arFullName" ILIKE '%${searchKey}%'
                )
            )
          `),
          true
        )
      ];
    }

    // Handle reviewStatus filter
    if (reviewStatus) {
      const reviewedCourseIds = await this.parseSubqueryToArray(`
        SELECT DISTINCT "learningProgramId"
        FROM "Reviews"
        WHERE "userId" = '${userId}'
      `);

      courseWhere.id =
        reviewStatus === ReviewStatusEnum.REVIEWED ?
          { [Op.in]: reviewedCourseIds }
        : {
            [Op.in]: sortedCourseIds.filter(
              id => !reviewedCourseIds.includes(id)
            )
          };
    }

    // Fetch courses using findAll
    const courses = await this.courseRepo.findAll(courseWhere, [
      {
        model: CourseLecturer,
        as: 'courseLecturers',
        required: true,
        include: [
          {
            model: Lecturer,
            as: 'lecturer',
            required: true,
            include: [
              {
                model: User,
                as: 'user',
                required: true
              }
            ]
          }
        ]
      }
    ]);

    // Remove duplicates (if any)
    const uniqueCourses = [...new Map(courses.map(c => [c.id, c])).values()];

    // Maintain custom sort order
    uniqueCourses.sort(
      (a, b) => sortedCourseIds.indexOf(a.id) - sortedCourseIds.indexOf(b.id)
    );

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const totalCount = uniqueCourses.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Paginate manually
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = uniqueCourses.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pageInfo: {
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        currentPage: page,
        totalPages,
        totalCount
      }
    };
  }

  async parseSubqueryToArray(subqueryLiteral: any): Promise<string[]> {
    const queryResult = (await this.sequelize.query(subqueryLiteral, {
      type: QueryTypes.SELECT
    })) as ReviewResult[];
    return queryResult.map(row => row.courseId);
  }
  async getNotificationsCount(userId: string): Promise<number> {
    return (
      await this.notificationUserStatusRepo.findAll(
        {
          receiverId: userId,
          seenAt: null
        },
        [
          {
            model: Notification,
            required: true,
            as: 'notification',
            where: { seen: false }
          }
        ]
      )
    )?.length;
  }

  async getCartItemsCount(userId: string): Promise<number> {
    return (
      await this.cartsRepo.findOne(
        {
          userId
        },
        [
          {
            model: CartItem,
            as: 'cartItems'
          }
        ]
      )
    )?.cartItems?.length;
  }
  async usersWithLecturerRoleForSiteMap() {
    const usersWithLecturerRole = await this.userRepo.findAll(
      {
        role: UserRoleEnum.LECTURER
      },
      [
        {
          model: Lecturer,
          required: true,
          where: { status: ApprovalStatusEnum.APPROVED }
        }
      ],
      undefined,
      ['id', 'updatedAt']
    );
    return usersWithLecturerRole.map(u => {
      return {
        id: u.id,
        type: null,
        updatedAt: u.updatedAt
      };
    });
  }
  async addFcmTokenToUser(user: User, device?: DeviceEnum, fcmToken?: string) {
    console.log('fcmToken', fcmToken);

    const saved = user.fcmTokens[device.toLowerCase()];
    const updated =
      fcmToken ?
        [...(Array.isArray(saved) ? saved : [saved]), fcmToken]
      : saved;

    await this.userRepo.updateOne(
      {
        id: user.id
      },
      {
        fcmTokens: {
          ...user.fcmTokens,
          [device.toLowerCase()]: updated
        }
      }
    );
  }

  async deleteFcmTokenFromUser(user: User, fcmToken: string) {
    const saved = user.fcmTokens;
    const updated = Object.keys(saved).reduce((acc, key) => {
      const tokens = Array.isArray(saved[key]) ? saved[key] : [saved[key]];
      return {
        ...acc,
        [key]: tokens.filter(t => t !== fcmToken)
      };
    }, {});
    await this.userRepo.updateOne(
      {
        id: user.id
      },
      {
        fcmTokens: updated
      }
    );
    return;
  }

  async updatePhone(input: UpdatePhone, userId: string): Promise<User> {
    // find if phone already exists
    const alreadyExists = await this.userRepo.findOne({
      phone: input.phone,
      id: { [Op.ne]: userId }
    });

    if (alreadyExists) {
      throw new BaseHttpException(ErrorCodeEnum.PHONE_ALREADY_EXISTS);
    } else {
      return await this.userRepo.updateOne(
        {
          id: userId
        },
        {
          phone: input.phone
        }
      );
    }
  }

  async updateUserProfilePicture(
    input: updateProfilePicture,
    userId: string
  ): Promise<User> {
    const user = await this.userRepo.findOne({
      id: userId
    });

    if (!user) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.sequelize.transaction(async transaction => {
      let updatedUser = user;

      if (input.profilePicture) {
        await this.uploaderService.setUploadedFilesReferences(
          [input.profilePicture],
          'User',
          'profilePicture',
          user.id,
          transaction
        );

        await this.uploaderService.removeOldFilesReferences(
          [input.profilePicture],
          [user.profilePicture],
          transaction
        );
      }

      updatedUser = await this.userRepo.updateOne(
        { id: userId },
        { profilePicture: input.profilePicture },
        transaction
      );

      return updatedUser;
    });
  }

  async deleteUserProfilePicture(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      id: userId
    });

    if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);

    await this.userRepo.updateOne(
      {
        id: userId
      },
      {
        profilePicture: null
      }
    );

    return true;
  }

  async seedInitialPasswordHistory(): Promise<boolean> {
    const users = await User.findAll({
      where: { password: { [Op.ne]: null } },
      attributes: ['id', 'password']
    });

    const existingRecords = await this.userPasswordHistoryRepo.findAll();
    if (existingRecords.length) return true;

    const records = users.map(u => ({
      userId: u.id,
      password: u.password,
      changedAt: new Date()
    }));

    await this.userPasswordHistoryRepo.bulkCreate(records);

    return true;
  }

  private async ensureSingleSuperAdmin(
    securityGroupId: string,
    currentUserId?: string
  ): Promise<void> {
    const superAdminSecurityGroupId =
      await this.findOrCreateSuperAdminSecurityGroup();

    if (securityGroupId !== superAdminSecurityGroupId) {
      return;
    }

    const existingSuperAdmin = await this.userRepo.findOne({
      securityGroupId: superAdminSecurityGroupId
    });

    if (existingSuperAdmin && existingSuperAdmin.id !== currentUserId) {
      throw new BaseHttpException(ErrorCodeEnum.SUPER_ADMIN_ALREADY_EXISTS);
    }
  }
}
