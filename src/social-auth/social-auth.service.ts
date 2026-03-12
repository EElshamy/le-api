import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartService } from '@src/cart/services/cart.service';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
import { Sequelize } from 'sequelize-typescript';
import { Repositories } from '../_common/database/database-repository.enum';
import { IRepository } from '../_common/database/repository.interface';
import { BaseHttpException } from '../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../_common/exceptions/error-code.enum';
import { AuthService } from '../auth/auth.service';
import { ActionTypeEnum } from '../user-sessions/user-sessions.enum';
import { UserSessionService } from '../user-sessions/user-sessions.service';
import { User } from '../user/models/user.model';
import { UserService } from '../user/services/user.service';
import { UserTransformer } from '../user/transformers/user.transformer';
import {
  DeviceEnum,
  UserRoleEnum,
  UserVerificationCodeUseCaseEnum
} from '../user/user.enum';
import { CheckSocialStatusInput } from './inputs/check-social-status.input';
import { LinkSocialAccountInput } from './inputs/link-social-account.input';
import { SocialLoginInput } from './inputs/social-login-input';
import { SocialMergeInput } from './inputs/social-merge.input';
import { SocialRegisterInput } from './inputs/social-register.input';
import {
  SocialAccountEmailStatus,
  SocialAccountRequiredActionEnum,
  SocialProvidersEnum
} from './social-auth.enum';
import {
  SocialRegisterType,
  ValidateSocialProviderInput
} from './social-auth.type';
import { UserSocialAccount } from './user-social-account.model';
import { AppleInfoFetcher } from './validators/apple-fetcher.service';
import { FacebookInfoFetcher } from './validators/facebook-fetcher.service';
import { GoogleInfoFetcher } from './validators/google-fetcher.service';
import { ISocialProviderInfoFetcher } from './validators/provider-validator.interface';

@Injectable()
export class SocialAuthService {
  constructor(
    @Inject(Repositories.UserSocialAccountsRepository)
    private readonly socialAccountRepo: IRepository<UserSocialAccount>,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: IRepository<User>,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly userTransformer: UserTransformer,
    @Inject(SEQUELIZE_INSTANCE_NEST_DI_TOKEN)
    private readonly sequelize: Sequelize,
    private readonly userSessionService: UserSessionService,
    @Inject(GoogleInfoFetcher)
    private readonly googleInfoFetcher: ISocialProviderInfoFetcher,
    @Inject(FacebookInfoFetcher)
    private readonly facebookInfoFetcher: ISocialProviderInfoFetcher,
    @Inject(AppleInfoFetcher)
    private readonly appleInfoFetcher: ISocialProviderInfoFetcher,
    private readonly configService: ConfigService,
    private readonly cartService: CartService
  ) {}

  /**
   *
   * check if user with providerId exists and if verified return it with token
   * @returns {User}
   */
  async socialLogin(input: SocialLoginInput): Promise<User> {
    this.validateLoginPlatform(input.loginDetails.device, input.provider);
    const userBySocialAccount = await this.socialAccountRepo.findOne(
      {
        providerId: input.providerId,
        provider: input.provider
      },
      [User]
    );

    if (userBySocialAccount && userBySocialAccount.user.email) {
      return await this.loginAndUpdateLoginDetails(
        input,
        userBySocialAccount.user
      );
    }

    //otherwise delete the user if not verified and return null
    if (userBySocialAccount && !userBySocialAccount.user.email) {
      await this.userRepo.deleteAll({ id: userBySocialAccount.userId });
    }
    throw new BaseHttpException(ErrorCodeEnum.SOCIAL_ACCOUNT_DOESNT_EXIST);
  }

  /**
   * attempt to signup with social provider and check if there's accounts to be merged
   */
  async socialRegister(input: SocialRegisterInput): Promise<User> {
    await this.validateSocialProviderData({
      ...input,
      authToken: input.providerAuth.authToken
    });

    // this.validateLoginPlatform(input.loginDetails.device, input.provider);
    await this.userService.deleteDuplicatedUsersAtNotVerifiedEmail(input.email);
    await this.errorIfUserWithSocialAccountExists(input.providerId);

    const userByEmail = await this.userRepo.findOne({
      email: input.email.toLowerCase()
    });

    const state = this.getSocialState(!!userByEmail, input.isManuallyEntered);

    if (
      [
        SocialAccountEmailStatus.EXISTS_MANUAL,
        SocialAccountEmailStatus.EXISTS_PROVIDED
      ].includes(state as SocialAccountEmailStatus)
    ) {
      throw new BaseHttpException(ErrorCodeEnum.ACCOUNT_EXISTS);
    }

    //the email is provided by the social provider so it's already verified
    if (state === SocialAccountEmailStatus.DOESNT_EXIST_PROVIDED) {
      const { user, sessionId } = await this.createUserRegistrationData(input);
      const cart = await this.cartService.createCart(user);
      await this.userRepo.updateOneFromExistingModel(user, {
        cartId: cart.id
      });
      return this.authService.appendAuthTokenToUser(user, sessionId);
    }

    // create unverified user and await its verification
    if (state === SocialAccountEmailStatus.DOESNT_EXIST_MANUAL) {
      const { user } = await this.createUserRegistrationData(input);
      await this.authService.sendEmailVerificationCode({
        email: input.email,
        useCase: UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION
      });

      return user;
    }
  }

  /**
   * determines social provider status and decides whether to merge accounts or register new one
   * and wether it needs to verify the email or not
   * @param input
   */

  public async checkSocialProviderStatus(
    input: CheckSocialStatusInput
  ): Promise<SocialRegisterType> {
    let socialProviderUsed: UserSocialAccount,
      actionRequired: SocialAccountRequiredActionEnum;

    await this.errorIfUserWithSocialAccountExists(input.providerId);
    await this.validateSocialProviderData({
      ...input,
      authToken: input.providerAuth.authToken
    });

    const userByEmail = await this.userRepo.findOne({
      email: input.email.toLowerCase()
    });
    const state = this.getSocialState(!!userByEmail, input.isManuallyEntered);

    if (
      [
        SocialAccountEmailStatus.EXISTS_MANUAL,
        SocialAccountEmailStatus.EXISTS_PROVIDED
      ].includes(state as SocialAccountEmailStatus)
    ) {
      this.errorIfEmailDoesntBelongToUser(userByEmail.role);
      socialProviderUsed = await this.socialAccountRepo.findOne({
        userId: userByEmail.id,
        provider: input.provider
      });
    }

    /*
      there's no account with the same email
      the email is provided by the social provider so it's already verified
    */
    if (state === SocialAccountEmailStatus.DOESNT_EXIST_PROVIDED)
      actionRequired = SocialAccountRequiredActionEnum.REGISTER;

    /*
      there's no account with the same email the user entered
      create unverified user and await its verification
    */
    if (state === SocialAccountEmailStatus.DOESNT_EXIST_MANUAL)
      actionRequired = SocialAccountRequiredActionEnum.REGISTER_VERIFICATION;

    /*
      there's an account with the same email,
      the email is provided by the social provider so we automatically verify it
      await user permission to merge the account
    */
    if (state === SocialAccountEmailStatus.EXISTS_PROVIDED)
      actionRequired =
        !!socialProviderUsed ?
          SocialAccountRequiredActionEnum.MERGE_SAME_PROVIDER
        : SocialAccountRequiredActionEnum.MERGE;

    /*
      account with the same email exists so that requires merge
      and email is manually entered to verify account ownership
    */
    if (state === SocialAccountEmailStatus.EXISTS_MANUAL) {
      await this.authService.sendEmailVerificationCode({
        email: userByEmail.email,
        useCase: UserVerificationCodeUseCaseEnum.SOCIAL_EMAIL_VERIFICATION
      });
      actionRequired =
        !!socialProviderUsed ?
          SocialAccountRequiredActionEnum.VERIFICATION_MERGE_SAME_PROVIDER
        : SocialAccountRequiredActionEnum.VERIFICATION_MERGE;
    }

    return {
      actionRequired: actionRequired,
      user:
        state === SocialAccountEmailStatus.EXISTS_MANUAL ? userByEmail
        : state === SocialAccountEmailStatus.EXISTS_PROVIDED ?
          this.authService.appendTemporaryTokenToUser(userByEmail)
        : null
    };
  }

  private getSocialState(
    userByEmailExists: boolean,
    isManuallyEntered: boolean
  ): string {
    const states = {
      [SocialAccountEmailStatus.EXISTS_MANUAL]: Number(
        userByEmailExists && isManuallyEntered
      ),
      [SocialAccountEmailStatus.EXISTS_PROVIDED]: Number(
        userByEmailExists && !isManuallyEntered
      ),
      [SocialAccountEmailStatus.DOESNT_EXIST_MANUAL]: Number(
        !userByEmailExists && isManuallyEntered
      ),
      [SocialAccountEmailStatus.DOESNT_EXIST_PROVIDED]: Number(
        !userByEmailExists && !isManuallyEntered
      )
    };
    let state: string;
    for (const s in states) {
      if (states[s]) state = s;
    }
    return state;
  }

  async socialAccountMerge(input: SocialMergeInput, currentUser: User) {
    await this.validateSocialProviderData({
      ...input,
      ...input.providerAuth
    });

    this.validateLoginPlatform(input.loginDetails.device, input.provider);
    try {
      await this.errorIfUserWithSocialAccountExists(input.providerId);
      const user = await this.userService.getUserByVerifiedEmailOrError(
        input.email
      );
      this.errorIfEmailDoesntBelongToUser(user.role);

      if (user.id !== currentUser.id)
        throw new BaseHttpException(ErrorCodeEnum.MERGE_UNAUTHORIZED);

      const socialProviderUsed = await this.socialAccountRepo.findOne({
        userId: currentUser.id,
        provider: input.provider
      });

      // if (socialProviderUsed && socialProviderUsed.providerId === input.providerId) {
      //   const sessionId = await this.userSessionService.createUserSession({
      //     ...input.loginDetails,
      //     actionType: ActionTypeEnum.LOGIN,
      //     userId: user.id
      //   });
      //   return this.authService.appendAuthTokenToUser(currentUser, sessionId);
      // }

      if (socialProviderUsed)
        await this.socialAccountRepo.deleteAll({ id: socialProviderUsed.id });

      await this.socialAccountRepo.createOne({
        userId: currentUser.id,
        provider: input.provider,
        providerId: input.providerId
      });

      return await this.loginAndUpdateLoginDetails(input, user);
    } catch (error) {
      throw new BaseHttpException(error.status || ErrorCodeEnum.UNKNOWN_ERROR);
    }
  }

  async linkSocialAccount(input: LinkSocialAccountInput, currentUser: User) {
    try {
      await this.validateSocialProviderData(
        {
          ...input,
          authToken: input.providerAuth.authToken
        },
        true
      );

      const socialProviderUsed = await this.socialAccountRepo.findOne({
        userId: currentUser.id,
        provider: input.provider
      });

      if (socialProviderUsed?.providerId === input.providerId) return true;

      if (socialProviderUsed)
        throw new BaseHttpException(ErrorCodeEnum.SAME_PROVIDER_CONNECTED);
      await this.errorIfUserWithSocialAccountExists(input.providerId);

      await this.socialAccountRepo.createOne({
        userId: currentUser.id,
        provider: input.provider,
        providerId: input.providerId
      });
      return true;
    } catch (error) {
      throw new BaseHttpException(error.status || ErrorCodeEnum.UNKNOWN_ERROR);
    }
  }

  async mySocialAccounts(currentUser: User) {
    const socialAccounts = await this.socialAccountRepo.findAll(
      {
        userId: currentUser.id
      },
      [User]
    );

    if (socialAccounts[0]?.user?.password || socialAccounts.length > 1) {
      socialAccounts.forEach(
        socialProvider => (socialProvider.allowDisconnect = true)
      );
    }
    return socialAccounts;
  }

  async disconnectSocialAccount(input: SocialLoginInput, currentUser: User) {
    const socialAccounts = await this.socialAccountRepo.findAll({
      userId: currentUser.id
    });

    const doesUserHaveSocialAccount = socialAccounts.find(
      socialAccount => socialAccount.providerId === input.providerId
    );

    if (!doesUserHaveSocialAccount)
      throw new BaseHttpException(ErrorCodeEnum.SOCIAL_ACCOUNT_DOESNT_EXIST);

    if (socialAccounts.length <= 1 && !currentUser.password)
      throw new BaseHttpException(ErrorCodeEnum.DISCONNECTION_FAILED);

    await this.socialAccountRepo.deleteAll({
      userId: currentUser.id,
      providerId: input.providerId,
      provider: input.provider
    });
    return true;
  }

  private validateLoginPlatform(
    device: DeviceEnum,
    provider: SocialProvidersEnum
  ) {
    if (provider === SocialProvidersEnum.APPLE && device !== DeviceEnum.IOS)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_PLATFORM);
  }

  private async loginAndUpdateLoginDetails(
    input: SocialLoginInput,
    user: User
  ) {
    if (user.isBlocked) throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);
    if (user.isDeleted) throw new BaseHttpException(ErrorCodeEnum.USER_DELETED);
    const session = await this.userSessionService.createUserSession({
      ...input.loginDetails,
      actionType: ActionTypeEnum.LOGIN,
      userId: user.id
    });
    const device = input.loginDetails?.device?.toLowerCase();
    const fcmToken = input.loginDetails?.fcmToken;

    if (device && fcmToken) {
      const saved = user.fcmTokens?.[device];
      const updated = [
        ...(Array.isArray(saved) ? saved
        : saved ? [saved]
        : []),
        fcmToken
      ];

      await this.userRepo.updateOne(
        {
          id: user.id
        },
        {
          fcmTokens: {
            ...user.fcmTokens,
            [device]: updated
          }
        }
      );
    }
    await this.userService.updateUserActivityStatus(user);
    return this.authService.appendAuthTokenToUser(user, session);
  }

  private async createUserRegistrationData(input: SocialRegisterInput) {
    return await this.sequelize.transaction(async transaction => {
      const transformedInput =
        await this.userTransformer.socialRegisterInputTransformer(input);
      const user = await this.userRepo.createOne(
        { ...transformedInput },
        transaction
      );
      await this.socialAccountRepo.createOne(
        { userId: user.id, ...input },
        transaction
      );
      const sessionId = await this.userSessionService.createUserSession({
        ...input.loginDetails,
        userId: user.id,
        actionType: ActionTypeEnum.SIGN_UP,
        transaction
      });
      return { user, sessionId };
    });
  }

  private async errorIfUserWithSocialAccountExists(providerId: string) {
    const userBySocialAccount = await this.socialAccountRepo.findOne({
      providerId
    });
    if (userBySocialAccount)
      throw new BaseHttpException(ErrorCodeEnum.SOCIAL_ACCOUNT_EXISTS);
  }

  private getSocialProviderService(provider: SocialProvidersEnum) {
    let service: ISocialProviderInfoFetcher;
    switch (provider) {
      case SocialProvidersEnum.GOOGLE:
        return this.googleInfoFetcher;

      case SocialProvidersEnum.FACEBOOK:
        return this.facebookInfoFetcher;

      case SocialProvidersEnum.APPLE:
        return this.appleInfoFetcher;

      default:
        throw new BaseHttpException(ErrorCodeEnum.UNSUPPORTED_PROVIDER);
    }
  }

  async validateSocialProviderData(
    input: ValidateSocialProviderInput,
    wantsToLink: boolean = false
  ) {
    if (this.configService.get<string>('NODE_ENV') === 'test') return;
    const service = this.getSocialProviderService(input.provider);
    const userDataFromProvider = await service.getUserInfo({
      providerToken: input.authToken
    });

    console.log({ userDataFromProvider });

    if (wantsToLink) {
      const emailExists =
        userDataFromProvider?.email ?
          await this.userRepo.findOne({
            email: userDataFromProvider.email
          })
        : false;
      if (!!emailExists)
        throw new BaseHttpException(ErrorCodeEnum.EMAIL_ALREADY_EXISTS);
    }

    if (!userDataFromProvider)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_PROVIDER_DATA);

    if (input.providerId !== userDataFromProvider.id)
      throw new BaseHttpException(ErrorCodeEnum.INVALID_PROVIDER_DATA);

    if (!input.email) return;

    if (
      input.isManuallyEntered === false &&
      input.email !== userDataFromProvider.email
    )
      throw new BaseHttpException(ErrorCodeEnum.INVALID_PROVIDER_DATA);

    if (input?.phone) {
      await this.userService.errorIfUserWithPhoneExistsForRegisteration(
        input?.phone
      );
    }
  }

  errorIfEmailDoesntBelongToUser(userRole: UserRoleEnum) {
    if (userRole === UserRoleEnum.LECTURER)
      throw new BaseHttpException(ErrorCodeEnum.EMAIL_BELONGS_TO_LECTURER);

    if (userRole === UserRoleEnum.ADMIN)
      throw new BaseHttpException(ErrorCodeEnum.PERMISSION_DENIED);
  }
}
