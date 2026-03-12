import { Inject, Injectable } from '@nestjs/common';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { HelperService } from '@src/_common/utils/helper.service';
import { RegisterInput } from '@src/auth/inputs/register.input';
import * as bcrypt from 'bcryptjs';
import { Op, Order, Sequelize, WhereOptions } from 'sequelize';
import { Repositories } from '../../_common/database/database-repository.enum';
import { IRepository } from '../../_common/database/repository.interface';
import { PaginatorInput } from '../../_common/paginator/paginator.input';
import { SortTypeEnum } from '../../_common/paginator/paginator.types';
import { CodePrefix } from '../../_common/utils/helpers.enum';
import { RegisterAsLecturerInput } from '../../auth/inputs/register-as-lecturer.input';
import { SocialRegisterInput } from '../../social-auth/inputs/social-register.input';
import { CreateUserBoardInput } from '../inputs/create-user-board.input';
import { UpdateAdministratorBoardInput } from '../inputs/update-administrator-board.input';
import { UpdateUserBoardInput } from '../inputs/update-user-board.input';
import { UsersBoardFilter } from '../inputs/users-board.filter';
import { UsersBoardSort } from '../inputs/users-board.sort.input';
import { User } from '../models/user.model';
import { LangEnum, UserRoleEnum, UserSortEnum } from '../user.enum';
import { FcmTokenTransformerInput } from '../user.interface';
import { FcmTokensType } from '../user.type';
import { isString } from 'class-validator';
import { UserPasswordHistory } from '../models/user-password-history.model';

@Injectable()
export class UserTransformer {
  constructor(
    private readonly helperService: HelperService,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    @Inject(Repositories.UserPasswordHistoriesRepository)
    private readonly userPasswordHistoryRepo: IRepository<UserPasswordHistory>
  ) {}

  async registerAsUserInputTransformer(
    input: RegisterInput,
    favLang: LangEnum
  ): Promise<Partial<User>> {
    return {
      ...input,
      email: null,
      favLang,
      unverifiedEmail: input.email,
      ...this.fullNameTransformer(input.firstName, input.lastName),
      password: await this.helperService.hashPassword(input.password),
      lastActiveAt: new Date(),
      fcmTokens: this.fcmTokenTransform({
        device: input.loginDetails.device,
        fcmToken: input.loginDetails.fcmToken
      })
    };
  }
  private fcmTokenTransform(input: FcmTokenTransformerInput): FcmTokensType {
    const { fcmToken, device, userSavedFcmTokens } = input;
    let wereSavedTokens: boolean;

    if (userSavedFcmTokens) {
      wereSavedTokens = Object.entries(userSavedFcmTokens).length > 0;
    }

    const deviceField = device?.toLowerCase();
    let transformedFcmTokens: FcmTokensType;

    if (wereSavedTokens && fcmToken && device) {
      transformedFcmTokens = Object.assign(userSavedFcmTokens, {
        [deviceField]:
          Array.isArray(userSavedFcmTokens[deviceField]) ?
            [...userSavedFcmTokens[deviceField], fcmToken]
          : isString(userSavedFcmTokens[deviceField]) ?
            [userSavedFcmTokens[deviceField], fcmToken]
          : fcmToken
      });
      return transformedFcmTokens;
    } else if (!wereSavedTokens && fcmToken && device) {
      transformedFcmTokens = { [deviceField]: fcmToken };
      return transformedFcmTokens;
    }
  }
  fullNameTransformer(
    firstName: string,
    lastName: string,
    arFirstName?: string,
    arLastName?: string
  ) {
    return {
      arFullName: (arFirstName + ' ' + arLastName)?.trim(),
      enFullName: (firstName + ' ' + lastName)?.trim()
    };
  }

  public async checkPasswordAndHashIt(
    currentPassword: string,
    oldPassword: string,
    newPassword: string,
    userId: string
    // confirmPassword: string
  ): Promise<string> {
    if (currentPassword && !oldPassword)
      throw new BaseHttpException(ErrorCodeEnum.WRONG_PASSWORD);

    return await this.validateOldPasswordAndHashIt(
      currentPassword,
      oldPassword,
      newPassword,
      userId
    );
  }

  async validateOldPasswordAndHashIt(
    currentPassword: string,
    oldPassword: string,
    newPassword: string,
    userId: string
  ) {
    // Check current password matches old password
    if (
      currentPassword &&
      !(await bcrypt.compare(oldPassword, currentPassword))
    ) {
      throw new BaseHttpException(ErrorCodeEnum.WRONG_PASSWORD);
    }

    // Check new password is not the same as the old one
    if (currentPassword && oldPassword === newPassword) {
      throw new BaseHttpException(ErrorCodeEnum.OLD_PASSWORD);
    }

    // Check password history
    const previousPasswords = await this.userPasswordHistoryRepo.findAll({
      userId
    });

    for (const entry of previousPasswords) {
      const isUsedBefore = await bcrypt.compare(newPassword, entry.password);
      if (isUsedBefore) {
        throw new BaseHttpException(ErrorCodeEnum.PASSWORD_USED_BEFORE);
      }
    }

    // Hash new password
    return await this.helperService.hashPassword(newPassword);
  }
  async socialRegisterInputTransformer(input: SocialRegisterInput) {
    const device = input.loginDetails?.device?.toLowerCase?.();
    const fcmToken = input.loginDetails?.fcmToken;

    const fcmTokens = device && fcmToken ? { [device]: [fcmToken] } : {};

    return {
      lastActiveAt: new Date(),
      ...input,
      paswordUpdatedAt: new Date(),
      fcmTokens,
      ...this.fullNameTransformer(input.firstName, input.lastName),
      ...(input.isManuallyEntered ?
        {
          unverifiedEmail: input.email,
          email: null
        }
      : {
          email: input.email,
          code: await this.helperService.generateModelCodeWithPrefix(
            CodePrefix.USER,
            this.userRepo
          )
        })
    };
  }

  usersBoardTransformer(
    currentUserId: string,
    filter: UsersBoardFilter = {},
    paginate: PaginatorInput = {},
    sortBy: UsersBoardSort = {
      sortBy: UserSortEnum.CREATED_AT,
      sortType: SortTypeEnum.DESC
    }
  ): [WhereOptions<User>, Order | string, number, number] {
    return [
      {
        role: UserRoleEnum.USER,
        id: { [Op.ne]: currentUserId },
        code: { [Op.ne]: null },
        ...(filter.notAssignedToCourseId && {
          '$assignedCourses.id$': { [Op.is]: null }
        }),
        ...(filter.isBlocked !== undefined && { isBlocked: filter.isBlocked }),
        ...(filter.isDeleted !== undefined && { isDeleted: filter.isDeleted }),
        ...(filter.searchKey && {
          [Op.or]: [
            {
              arFullName: {
                [Op.iLike]: `%${this.helperService.trimAllSpaces(filter.searchKey)}%`
              }
            },
            {
              enFullName: {
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
      this.sortUsersBoard(sortBy),
      paginate.page,
      paginate.limit
    ];
  }

  private sortUsersBoard(sort: UsersBoardSort): Order {
    switch (sort.sortBy) {
      case UserSortEnum.AMOUNT_SPENT:
        return [];

      case UserSortEnum.LAST_ACTIVE:
        return [
          [
            Sequelize.literal('COALESCE("lastActiveAt", \'1970-01-01\')'),
            sort.sortType
          ]
        ];

      default:
        return [[sort.sortBy, sort.sortType]];
    }
  }

  async createUserBoardTransformer(input: CreateUserBoardInput) {
    return {
      ...input,
      ...this.fullNameTransformer(input.firstName, input.lastName),
      password: await this.helperService.hashPassword(input.password),
      requireChangePassword: true,
      code: await this.helperService.generateModelCodeWithPrefix(
        CodePrefix.USER,
        this.userRepo
      )
    };
  }
  async updateUserBoardTransformer(input: UpdateUserBoardInput, user: User) {
    return {
      ...input,
      ...this.fullNameTransformer(
        input.firstName ?? user.firstName,
        input.lastName ?? user.lastName
      ),
      ...(input.password && {
        password: await this.helperService.hashPassword(input.password)
      }),
      profilePicture: input.profilePicture ?? user.profilePicture
    };
  }

  async updateAdministratorBoardTransformer(
    input: UpdateAdministratorBoardInput,
    user: User
  ) {
    return {
      ...input,
      ...this.fullNameTransformer(
        input.firstName ?? user.firstName,
        input.lastName ?? user.lastName
      ),
      ...(input.password && {
        password: await this.helperService.hashPassword(input.password)
      })
    };
  }

  async registerAsLecturerUserTransformer(input: RegisterAsLecturerInput) {
    return {
      ...input,
      email: null,
      unverifiedEmail: input.email,
      password: await this.helperService.hashPassword(input.password),
      role: UserRoleEnum.LECTURER
    };
  }
}
