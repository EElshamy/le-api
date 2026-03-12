import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { GqlContext } from '../../_common/graphql/graphql-context.type';
import { GqlBooleanResponse } from '../../_common/graphql/graphql-response.type';
import { AllowTemporaryToken } from '../../auth/allow-temp-token.guard';
import { CurrentUser } from '../../auth/auth-user.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { HasRole } from '../../auth/auth.metadata';
import { User } from '../../user/models/user.model';
import { UserRoleEnum } from '../../user/user.enum';
import { GqlUserResponse } from '../../user/user.response';
import { CheckSocialStatusInput } from '../inputs/check-social-status.input';
import { DisconnectSocialAccountInput } from '../inputs/disconnect-social-account.input';
import { LinkSocialAccountInput } from '../inputs/link-social-account.input';
import { SocialLoginInput } from '../inputs/social-login-input';
import { SocialMergeInput } from '../inputs/social-merge.input';
import { SocialRegisterInput } from '../inputs/social-register.input';
import { GqlSocialAccountsResponse } from '../social-auth.response';
import { SocialAuthService } from '../social-auth.service';
import { GqlSocialRegisterResponse } from '../social-response';
import { UserSocialAccount } from '../user-social-account.model';

@Resolver(UserSocialAccount)
export class SocialAuthResolver {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  //** ---------------------  QUERIES  --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.USER)
  @Query(returns => GqlSocialAccountsResponse)
  async mySocialAccounts(@CurrentUser() currentUser: User) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.socialAuthService.mySocialAccounts(currentUser);
  }

  @Query(returns => GqlSocialRegisterResponse)
  async checkSocialProviderStatus(
    @Args('input') input: CheckSocialStatusInput
  ) {
    return await this.socialAuthService.checkSocialProviderStatus(input);
  }

  //** --------------------- MUTATIONS --------------------- */

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.USER)
  @Mutation(returns => GqlBooleanResponse)
  async disconnectSocialAccount(
    @Args('input') input: DisconnectSocialAccountInput,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.socialAuthService.disconnectSocialAccount(
      input,
      currentUser
    );
  }

  @Mutation(returns => GqlUserResponse)
  async socialRegister(
    @Args('input') input: SocialRegisterInput,
    @Context('ipAddress') ipAddress: string
  ) {
    input.loginDetails.ipAddress = ipAddress;
    return await this.socialAuthService.socialRegister(input);
  }

  @Mutation(returns => GqlUserResponse)
  async socialLogin(
    @Args('input') input: SocialLoginInput,
    @Context('ipAddress') ipAddress: string
  ) {
    input.loginDetails.ipAddress = ipAddress;
    return await this.socialAuthService.socialLogin(input);
  }

  @UseGuards(AllowTemporaryToken(AuthGuard))
  @HasRole(UserRoleEnum.USER)
  @Mutation(returns => GqlUserResponse)
  async socialMerge(
    @Args('input') input: SocialMergeInput,
    @Context() context: GqlContext
  ) {
    input.loginDetails.ipAddress = context.ipAddress;
    return await this.socialAuthService.socialAccountMerge(
      input,
      context.currentUser
    );
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.USER)
  @Mutation(returns => GqlBooleanResponse)
  async linkSocialAccount(
    @Args('input') input: LinkSocialAccountInput,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.socialAuthService.linkSocialAccount(input, currentUser);
  }
}
