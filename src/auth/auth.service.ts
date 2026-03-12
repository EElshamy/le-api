import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { HelperService } from '@src/_common/utils/helper.service';
import { CartService } from '@src/cart/services/cart.service';
import { ApprovalStatusEnum } from '@src/lecturer/enums/lecturer.enum';
import { UserVerificationCode } from '@src/user-verification-code/user-verification-code.model';
import { UserVerificationCodeService } from '@src/user-verification-code/user-verification-code.service';
import { User } from '@src/user/models/user.model';
import { UserService } from '@src/user/services/user.service';
import { UserTransformer } from '@src/user/transformers/user.transformer';
import {
  LangEnum,
  UserRoleEnum,
  UserVerificationCodeUseCaseEnum,
  VerificationCodeDestination,
  VerificationCodeUseCasesEnum
} from '@src/user/user.enum';
import * as bcrypt from 'bcryptjs';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Sequelize } from 'sequelize-typescript';
import { MailService } from '../_common/mail/mail.service';
import { IMailService } from '../_common/mail/mail.type';
import { Templates } from '../_common/mail/templates-types';
import { CodePrefix } from '../_common/utils/helpers.enum';
import { LecturerService } from '../lecturer/services/lecturer.service';
import { ActionTypeEnum } from '../user-sessions/user-sessions.enum';
import { UserSessionService } from '../user-sessions/user-sessions.service';
import { VerificationCodeAndExpirationDate } from '../user/user.interface';
import {
  EmailAndPasswordLoginForBoardInput,
  EmailAndPasswordLoginInput
} from './inputs/email-password-login.input';
import { RegisterAsLecturerInput } from './inputs/register-as-lecturer.input';
import { RegisterInput } from './inputs/register.input';
import { ResetPasswordByEmailInput } from './inputs/reset-password-by-email.input';
import { SendEmailVerificationCodeInput } from './inputs/send-email-verification-code.input';
import {
  UpdateEmailBoardInput,
  UpdateEmailInput
} from './inputs/update-email.input';
import { VerifyForgetPasswordInput } from './inputs/verify-forget-password-code.input';
import { VerifyUserByEmailInput } from './inputs/verify-user-by-email.input';
import { UserSession } from '@src/user-sessions/user-sessions.model';
import { UserPasswordHistory } from '@src/user/models/user-password-history.model';
import { SortTypeEnum } from '@src/_common/paginator/paginator.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly userTransformer: UserTransformer,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    private readonly userService: UserService,
    private readonly userVerificationCodeService: UserVerificationCodeService,
    @Inject(Repositories.UserVerificationCodesRepository)
    private readonly userVerificationCodesRepo: IRepository<UserVerificationCode>,
    @Inject(Repositories.UserSessionsRepository)
    private readonly userSessionsRepo: IRepository<UserSession>,
    @Inject(Repositories.UserPasswordHistoriesRepository)
    private readonly userPasswordHistoryRepo: IRepository<UserPasswordHistory>,
    private readonly helperService: HelperService,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly userSessionService: UserSessionService,
    @Inject(MailService) private readonly mailService: IMailService,
    private readonly lecturerService: LecturerService,
    private readonly cartService: CartService
  ) {}

  //For temporary tokens mark the desired query/mutation to accept temporary tokens
  appendTemporaryTokenToUser(user: User) {
    return Object.assign(user, {
      token: this.helperService.generateAuthToken({
        userId: user.id,
        isTemp: true
      })
    });
  }

  public appendBoardAuthToken(user: User, sessionId: string) {
    return Object.assign(user, {
      token: this.helperService.generateAuthToken({
        userId: user.id,
        isAdmin: true,
        sessionId
      })
    });
  }

  async matchPassword(password: string, hash: string) {
    const isMatched = await bcrypt.compare(password, hash);
    if (!isMatched)
      throw new BaseHttpException(ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD);
  }

  appendAuthTokenToUser(user: User, sessionId: string) {
    return Object.assign(user, {
      token: this.helperService.generateAuthToken({
        userId: user.id,
        sessionId
      })
    });
  }

  async registerAsUser(input: RegisterInput, lang: LangEnum): Promise<User> {
    await this.userService.deleteRejectedLecturersWithTheSameEmailOrPhone(
      input.email
    );
    await this.userService.errorIfUserWithEmailExistsForRegisteration(
      input.email
    );
    await this.userService.errorIfUserWithPhoneExistsForRegisteration(
      input?.phone
    );
    await this.userService.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);
    const transformedInput =
      await this.userTransformer.registerAsUserInputTransformer(input, lang);

    const user = await this.sequelize.transaction(async transaction => {
      const user = await this.userRepo.createOne(
        { ...transformedInput },
        transaction
      );
      // try {
      //   const user = await this.userRepo.createOne(
      //     { ...transformedInput },
      //     transaction
      //   );
      // } catch (err) {
      //   console.error('CREATE USER ERROR', {
      //     name: err.name,
      //     message: err.message,
      //     parent: err.parent,
      //     sql: err.sql,
      //     stack: err.stack
      //   });
      //   throw err;
      // }
      await this.userSessionService.createUserSession({
        ...input.loginDetails,
        actionType: ActionTypeEnum.SIGN_UP,
        userId: user.id,
        transaction
      });

      return user;
    });

    await this.userPasswordHistoryRepo.createOne({
      userId: user.id,
      password: user.password,
      changedAt: new Date()
    });

    await this.sendVerificationCodeAfterRegister(
      user,
      UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
    );
    return user;
  }

  async emailAndPasswordLoginAdmin(
    input: EmailAndPasswordLoginForBoardInput
  ): Promise<User> {
    const user = await this.userService.getValidUserForLoginOrError({
      email: input.email
    });

    if (user.role !== UserRoleEnum.ADMIN)
      throw new BaseHttpException(ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD);

    return this.matchPasswordAndReturnBoardToken(input, user);
  }

  async emailAndPasswordLoginLecturer(
    input: EmailAndPasswordLoginForBoardInput
  ): Promise<User> {
    const user = await this.userService.getValidUserForLoginOrError({
      email: input.email
    });

    if (user.role !== UserRoleEnum.LECTURER) {
      throw new BaseHttpException(ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD);
    }

    if (!user.password) {
      throw new BaseHttpException(ErrorCodeEnum.PASSWORD_NOT_SET);
    }

    if (user?.lecturer?.status !== ApprovalStatusEnum.APPROVED) {
      throw new BaseHttpException(ErrorCodeEnum.LECTURER_NOT_APPROVED);
    }

    return this.matchPasswordAndReturnBoardToken(input, user);
  }

  //TODO: DELETE IT
  // async emailAndPasswordLoginBoard(
  //   input: EmailAndPasswordLoginForBoardInput
  // ): Promise<User> {
  //   const user = await this.userService.getValidUserForLoginOrError({
  //     email: input.email
  //   });
  //   if (user.role === UserRoleEnum.USER)
  //     throw new BaseHttpException(ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD);

  //   if (<UserRoleEnum>(<unknown>input.role) !== user.role)
  //     throw new BaseHttpException(ErrorCodeEnum.FAQ_DOES_NOT_EXIST);

  //   if (!user.password)
  //     throw new BaseHttpException(ErrorCodeEnum.PASSWORD_NOT_SET);

  //   await this.matchPassword(input.password, user.password);
  //   const sessionId = await this.userSessionService.createUserSession({
  //     ...input.loginDetails,
  //     actionType: ActionTypeEnum.LOGIN,
  //     userId: user.id
  //   });
  //   return this.appendBoardAuthToken(user, sessionId);
  // }

  private async matchPasswordAndReturnBoardToken(
    input: EmailAndPasswordLoginForBoardInput,
    user: User
  ) {
    await this.matchPassword(input.password, user.password);
    const sessionId = await this.userSessionService.createUserSession({
      ...input.loginDetails,
      actionType: ActionTypeEnum.LOGIN,
      userId: user.id
    });
    return this.appendBoardAuthToken(user, sessionId);
  }

  public async emailAndPasswordLogin(input: EmailAndPasswordLoginInput) {
    const user = await this.userService.getValidUserForLoginOrError({
      email: input.email.toLowerCase()
    });

    if (user.role !== UserRoleEnum.USER)
      throw new BaseHttpException(ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD);

    if (!user.password) throw new BaseHttpException(ErrorCodeEnum.NO_PASSWORD);

    await this.matchPassword(input.password, user.password);
    /* seeking to handle if the user logged in from multiple devices , 
    and wanted to login from one of them..
    here we add the fcm token to user's fcmTokens..
    and when logging out we would get the fcm token from user's session and delete it from user's fcmTokens
    * we can depend on user's sessions completely   
    */
    await this.userService.addFcmTokenToUser(
      user,
      input.loginDetails.device,
      input.loginDetails.fcmToken
    );
    const sessionId = await this.userSessionService.createUserSession({
      ...input.loginDetails,
      actionType: ActionTypeEnum.LOGIN,
      userId: user.id
    });
    await this.userService.updateUserActivityStatus(user);
    return this.appendAuthTokenToUser(user, sessionId);
  }

  async sendVerificationCodeAfterRegister(
    user: User,
    useCase: UserVerificationCodeUseCaseEnum
  ) {
    return await this.generateVerificationCodeAndSendMail(
      user,
      {
        email: user.unverifiedEmail,
        useCase
      },
      false
    );
  }

  async sendEmailVerificationCode(input: SendEmailVerificationCodeInput) {
    const user = await this.userService.userByEmailBasedOnUseCaseOrError({
      ...input,
      destination: VerificationCodeDestination.WEBSITE
    });
    return await this.generateVerificationCodeAndSendMail(user, input);
  }

  async sendEmailVerificationCodeBoard(input: SendEmailVerificationCodeInput) {
    const user = await this.userService.userByEmailBasedOnUseCaseOrError({
      ...input,
      destination: VerificationCodeDestination.BOARD
    });
    return await this.generateVerificationCodeAndSendMail(user, input);
  }

  async generateVerificationCodeAndSendMail(
    user: User,
    input: SendEmailVerificationCodeInput,
    isFixed: boolean = false
  ) {
    const codeAndExpiry = await this.generateVerificationCodeAndRemoveOldOne(
      user.id,
      input.useCase,
      isFixed
    );
    const emailDetails =
      this.determineAddressedEmailAndTemplateNameByUseCase(input);
    await this.mailService.send({
      to: input.email,
      template: emailDetails.templateName,
      subject: emailDetails.subject,
      templateData: {
        otp: codeAndExpiry.verificationCode
      }
    });
    return true;
  }

  private determineAddressedEmailAndTemplateNameByUseCase(
    input: SendEmailVerificationCodeInput
  ) {
    let templateName: Templates;
    let subject: string = 'Verify Your Email Address';
    switch (input.useCase) {
      case UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION:
        templateName = 'user-email-confirm';
        break;
      case UserVerificationCodeUseCaseEnum.EMAIL_UPDATE:
        templateName = 'user-email-confirm';
        break;
      case UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION:
        templateName = 'user-email-confirm';
        break;
      case UserVerificationCodeUseCaseEnum.PASSWORD_RESET:
        templateName = 'password-reset';
        subject = 'Your One-Time Password (OTP) for Password Reset';
        break;
      default:
        break;
    }

    return { templateName, subject };
  }

  private async generateVerificationCodeAndRemoveOldOne(
    userId: string,
    useCase: UserVerificationCodeUseCaseEnum,
    isFixed: boolean
  ): Promise<VerificationCodeAndExpirationDate> {
    const codeAndExpiry =
      this.userVerificationCodeService.generateVerificationCodeAndExpiryDate(
        isFixed
      );
    await this.sequelize.transaction(async transaction => {
      await this.userVerificationCodesRepo.deleteAll(
        { userId, useCase },
        transaction
      );
      await this.userVerificationCodesRepo.createOne(
        {
          code: codeAndExpiry.verificationCode,
          expiryDate: codeAndExpiry.expiryDate,
          userId,
          useCase
        },
        transaction
      );
      return true;
    });
    return codeAndExpiry;
  }

  async verifyUserVerificationCodeByUseCase(input: VerifyUserByEmailInput) {
    switch (input.useCase) {
      case VerificationCodeUseCasesEnum.EMAIL_VERIFICATION: {
        return this.verifyUserEmail(input);
      }

      case VerificationCodeUseCasesEnum.EMAIL_UPDATE: {
        return this.verifyEmailUpdateCode(input);
      }

      case VerificationCodeUseCasesEnum.SOCIAL_EMAIL_VERIFICATION: {
        return this.verifyEmailOwnership(input);
      }

      default:
        break;
    }
  }

  async verifyUserEmail(input: VerifyUserByEmailInput): Promise<User> {
    const user = await this.userService.userByEmailBasedOnUseCaseOrError({
      email: input.email,
      useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
    });
    await this.userVerificationCodeService.validVerificationCodeOrError({
      user,
      useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION,
      verificationCode: input.verificationCode
    });
    await this.userService.errorIfOtherUserHasSameVerifiedEmail(
      input.email,
      user.id
    );
    await this.userVerificationCodeService.deleteVerificationCodeAndUpdateUserModel(
      { user, useCase: UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION },
      {
        email: input.email,
        unverifiedEmail: null,
        code: await this.helperService.generateModelCodeWithPrefix(
          CodePrefix[user.role],
          this.userRepo
        )
      }
    );
    const userSessionId = await this.userSessionService.getSignUpSessionId(
      user.id
    );

    if (
      user &&
      input.useCase === VerificationCodeUseCasesEnum.EMAIL_VERIFICATION
    ) {
      const cart = await this.cartService.createCart(user);

      await this.userRepo.updateOneFromExistingModel(user, {
        cartId: cart.id
      });
    }
    return user.role === UserRoleEnum.USER ?
        this.appendAuthTokenToUser(user, userSessionId)
      : user;
  }

  async verifyEmailUpdateCode(input: VerifyUserByEmailInput): Promise<User> {
    const user = await this.userService.userByEmailBasedOnUseCaseOrError({
      email: input.email,
      useCase: UserVerificationCodeUseCaseEnum.EMAIL_UPDATE
    });
    await this.userVerificationCodeService.validVerificationCodeOrError({
      user,
      useCase: UserVerificationCodeUseCaseEnum.EMAIL_UPDATE,
      verificationCode: input.verificationCode
    });
    await this.userService.errorIfOtherUserHasSameVerifiedEmail(
      input.email,
      user.id
    );
    await this.userVerificationCodeService.deleteVerificationCodeAndUpdateUserModel(
      { user, useCase: UserVerificationCodeUseCaseEnum.EMAIL_UPDATE },
      {
        email: input.email,
        unverifiedEmail: null
      }
    );
    return user;
  }

  public async verifyEmailOwnership(
    input: VerifyUserByEmailInput
  ): Promise<User> {
    const user = await this.userService.userByEmailBasedOnUseCaseOrError({
      email: input.email,
      useCase: UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION
    });
    const isAlreadyVerified = !!user.email;

    await this.userVerificationCodeService.validVerificationCodeOrError({
      user,
      useCase: UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION,
      verificationCode: input.verificationCode
    });
    await this.userService.errorIfOtherUserHasSameVerifiedEmail(
      input.email,
      user.id
    );

    await this.userVerificationCodeService.deleteVerificationCodeAndUpdateUserModel(
      {
        user,
        useCase: UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION
      },
      user.email ? null : (
        {
          email: input.email,
          unverifiedEmail: null,
          code: await this.helperService.generateModelCodeWithPrefix(
            CodePrefix.USER,
            this.userRepo
          )
        }
      )
    );
    const userSessionId = await this.userSessionService.getSignUpSessionId(
      user.id
    );

    return isAlreadyVerified ?
        this.appendTemporaryTokenToUser(user)
      : this.appendAuthTokenToUser(user, userSessionId);
  }

  async verifyPasswordResetVerificationCode(input: VerifyForgetPasswordInput) {
    const user = await this.userService.userByEmailBasedOnUseCaseOrError({
      email: input.email,
      useCase: UserVerificationCodeUseCaseEnum.PASSWORD_RESET
    });

    await this.userVerificationCodeService.validVerificationCodeOrError({
      user,
      useCase: UserVerificationCodeUseCaseEnum.PASSWORD_RESET,
      verificationCode: input.verificationCode
    });

    return user;
  }

  async resetPasswordByEmail(input: ResetPasswordByEmailInput) {
    // Step 1: Verify the reset code and get the user
    const user = await this.verifyPasswordResetVerificationCode({
      email: input.email,
      verificationCode: input.verificationCode
    });

    // Step 2: Check if the new password matches the current one
    if (user.password) {
      const isMatched = await bcrypt.compare(input.newPassword, user.password);
      if (isMatched) {
        throw new BaseHttpException(ErrorCodeEnum.OLD_PASSWORD);
      }
    }

    const previousPasswords = (
      await this.userPasswordHistoryRepo.findPaginated(
        {
          userId: user.id
        },
        [[Sequelize.col('changedAt'), SortTypeEnum.DESC]],
        1,
        3,
        null
      )
    ).items;
    
    for (const record of previousPasswords) {
      const isMatched = await bcrypt.compare(
        input.newPassword,
        record.password
      );
      if (isMatched) {
        // New password is already used before
        throw new BaseHttpException(ErrorCodeEnum.PASSWORD_USED_BEFORE);
      }
    }

    // Step 4: Hash the new password
    const hashPassword = await this.helperService.hashPassword(
      input.newPassword
    );

    // Step 5: Update user password and delete verification code
    await this.userVerificationCodeService.deleteVerificationCodeAndUpdateUserModel(
      {
        user,
        useCase: UserVerificationCodeUseCaseEnum.PASSWORD_RESET
      },
      { password: hashPassword, requireChangePassword: false }
    );

    // Step 6: Store the new password in password history table
    await this.userPasswordHistoryRepo.createOne({
      userId: user.id,
      password: hashPassword,
      changedAt: new Date()
    });

    return true;
  }
  // async updateFcmToken(fcmToken: string, device: DeviceEnum, currentUser: User) {
  //   const fcmTokens = currentUser.fcmTokens;
  //   fcmTokens[device.toLowerCase()] = fcmToken;
  //   const user = await this.userRepo.findOne({ id: currentUser.id });
  //   await this.userRepo.updateOneFromExistingModel(user, { fcmTokens });
  //   return true;
  // }

  async changeUserEmail(currentUser: User, input: UpdateEmailInput) {
    await this.validatePasswordBeforeEmailChange(currentUser, input);

    return await this.validateNewEmailAndUpdate(currentUser, input.email);
  }

  async changeEmailBoard(currentUser: User, input: UpdateEmailBoardInput) {
    return await this.validateNewEmailAndUpdate(currentUser, input.email);
  }

  private async validateNewEmailAndUpdate(currentUser: User, newEmail: string) {
    await this.userService.errorIfOtherUserHasSameVerifiedEmail(
      newEmail,
      currentUser.id
    );

    if (currentUser.email === newEmail)
      throw new BaseHttpException(ErrorCodeEnum.SAME_OLD_EMAIL);

    await this.userService.deleteDuplicatedUsersAtNotVerifiedEmail(newEmail);

    const user = await this.userRepo.updateOne(
      { id: currentUser.id },
      { unverifiedEmail: newEmail }
    );

    await this.generateVerificationCodeAndSendMail(user, {
      email: newEmail,
      useCase: UserVerificationCodeUseCaseEnum.EMAIL_UPDATE
    });

    return user;
  }

  private async validatePasswordBeforeEmailChange(
    currentUser: User,
    input: UpdateEmailInput
  ) {
    if (!currentUser.password)
      throw new BaseHttpException(
        ErrorCodeEnum.PROVIDE_PASSWORD_BEFORE_EMAIL_CHANGE
      );

    try {
      await this.matchPassword(input.password, currentUser.password);
    } catch (err) {
      if (err.status === ErrorCodeEnum.INCORRECT_EMAIL_OR_PASSWORD)
        throw new BaseHttpException(ErrorCodeEnum.WRONG_PASSWORD);
    }
  }

  async registerAsLecturer(input: RegisterAsLecturerInput) {
    await this.userService.deleteRejectedLecturersWithTheSameEmailOrPhone(
      input.email,
      input.phone
    );
    await this.userService.errorIfUserWithEmailExistsForRegisteration(
      input.email
    );
    await this.userService.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);
    await this.userService.deleteDuplicatedUsersAtPhonesIfEmailNotVerifiedYet(
      input.phone
    );
    await this.userService.errorIfUserWithPhoneExists(input.phone);

    const user = await this.sequelize.transaction(async transaction => {
      const user = await this.userRepo.createOne(
        {
          ...(await this.userTransformer.registerAsLecturerUserTransformer(
            input
          ))
        },
        transaction
      );

      await this.userPasswordHistoryRepo.createOne({
        userId: user.id,
        password: user.password,
        changedAt: new Date()
      });

      await this.lecturerService.createLecturerRelatedInfoAfterRegister({
        ...input,
        userId: user.id,
        transaction
      });

      await this.userSessionService.createUserSession({
        ...input.loginDetails,
        userId: user.id,
        actionType: ActionTypeEnum.SIGN_UP,
        isActive: false,
        transaction
      });
      return user;
    });

    await this.sendVerificationCodeAfterRegister(
      user,
      UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
    );
    return user;
  }

  async logout(currentUser: User, sessionId: string) {
    //get fcmToken from session
    const fcmToken = (
      await this.userSessionsRepo.findOne({
        id: sessionId,
        userId: currentUser.id
      })
    ).fcmToken;
    if (fcmToken) {
      await this.userService.deleteFcmTokenFromUser(currentUser, fcmToken);
    }
    await this.userSessionService.deactivateUserSession(sessionId);
    return true;
  }
}
