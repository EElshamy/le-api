import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlBooleanResponse } from '@src/_common/graphql/graphql-response.type';
import { User } from '@src/user/models/user.model';
import { GqlUserResponse } from '@src/user/user.response';
import { GqlContext } from '../_common/graphql/graphql-context.type';
import { CurrentUser } from './auth-user.decorator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import {
  EmailAndPasswordLoginForBoardInput,
  EmailAndPasswordLoginInput
} from './inputs/email-password-login.input';
import { RegisterInput } from './inputs/register.input';
import { ResetPasswordByEmailInput } from './inputs/reset-password-by-email.input';
import { SendEmailVerificationCodeInput } from './inputs/send-email-verification-code.input';
import {
  UpdateEmailBoardInput,
  UpdateEmailInput
} from './inputs/update-email.input';
import { VerifyForgetPasswordInput } from './inputs/verify-forget-password-code.input';
import { VerifyUserByEmailInput } from './inputs/verify-user-by-email.input';
// import { ValidationMethodEnum } from '../_common/limiter/limiter.enum';
// import { OtpResendLimiterInterceptor } from '../_common/limiter/otp-resend-attempts.interceptor';
import { PdfService } from '../_common/pdf/pdf.service';
import { UserService } from '../user/services/user.service';
import { UserRoleEnum } from '../user/user.enum';
import { HasRole } from './auth.metadata';
import { RegisterAsLecturerInput } from './inputs/register-as-lecturer.input';
import { Throttle } from '@nestjs/throttler';
import { RequireAppCheck } from '@src/_common/app-check/decorator/app-check.decorator';
// import { OtpInvalidAttemptsLimiterInterceptor } from '../_common/limiter/otp-invalid-attempts.interceptor';

@Resolver('Auth')
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly pdfService: PdfService
  ) {}

  //** ---------------------  QUERIES  --------------------- */

  @UseGuards(AuthGuard)
  @Query(() => GqlUserResponse)
  async me(@CurrentUser() user: User) {
    this.userService.updateUserActivityStatus(user);
    return user;
  }

  //** --------------------- MUTATIONS --------------------- */

  // @RequireAppCheck()
  // @Throttle({
  //   default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  // }) // 10 requests per min or block for 1 hour
  // @Mutation(returns => GqlUserResponse, {
  //   deprecationReason: 'replaced by separate mutations for each role'
  // })
  // async emailAndPasswordLoginBoard(
  //   @Args('input') input: EmailAndPasswordLoginForBoardInput,
  //   @Context() { ipAddress }: GqlContext
  // ) {
  //   input.loginDetails.ipAddress = ipAddress;
  //   return await this.authService.emailAndPasswordLoginBoard(input);
  // }

  // @UseGuards(AppCheckGuard)
  @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlUserResponse)
  async emailAndPasswordLoginAdmin(
    @Args('input') input: EmailAndPasswordLoginForBoardInput,
    @Context() { ipAddress }: GqlContext
  ) {
    input.loginDetails.ipAddress = ipAddress;
    return await this.authService.emailAndPasswordLoginAdmin(input);
  }

  // @UseGuards(AppCheckGuard)
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlUserResponse)
  async emailAndPasswordLoginLecturer(
    @Args('input') input: EmailAndPasswordLoginForBoardInput,
    @Context() { ipAddress }: GqlContext
  ) {
    input.loginDetails.ipAddress = ipAddress;
    return await this.authService.emailAndPasswordLoginLecturer(input);
  }

  // @UseInterceptors(OtpResendLimiterInterceptor(ValidationMethodEnum.EMAIL))
  // @UseGuards(AppCheckGuard)
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlUserResponse)
  async registerAsUser(
    @Args('input') input: RegisterInput,
    @Context() { lang, ipAddress }: GqlContext
  ) {
    input.loginDetails.ipAddress = ipAddress;
    return await this.authService.registerAsUser(input, lang);
  }

  // @UseGuards(AppCheckGuard)
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlUserResponse)
  async registerAsLecturer(
    @Args('input') input: RegisterAsLecturerInput,
    @Context() { ipAddress }: GqlContext
  ) {
    input.loginDetails.ipAddress = ipAddress;
    return await this.authService.registerAsLecturer(input);
  }

  // @UseInterceptors(OtpResendLimiterInterceptor(ValidationMethodEnum.EMAIL))
  // @UseGuards(AppCheckGuard)
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlBooleanResponse)
  async sendEmailVerificationCode(
    @Args('input') input: SendEmailVerificationCodeInput
  ) {
    return await this.authService.sendEmailVerificationCode(input);
  }

  // @UseGuards(AppCheckGuard)
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlBooleanResponse)
  async sendEmailVerificationCodeBoard(
    @Args('input') input: SendEmailVerificationCodeInput
  ) {
    return await this.authService.sendEmailVerificationCodeBoard(input);
  }

  // @UseInterceptors(OtpInvalidAttemptsLimiterInterceptor(ValidationMethodEnum.EMAIL))
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlUserResponse)
  async verifyUserVerificationCodeByEmail(
    @Args('input') input: VerifyUserByEmailInput
  ) {
    return await this.authService.verifyUserVerificationCodeByUseCase(input);
  }

  // @UseGuards(AppCheckGuard)
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlUserResponse)
  async emailAndPasswordLogin(
    @Args('input') input: EmailAndPasswordLoginInput,
    @Context('ipAddress') ipAddress: string
  ) {
    input.loginDetails.ipAddress = ipAddress;
    return await this.authService.emailAndPasswordLogin(input);
  }

  @Mutation(returns => GqlBooleanResponse)
  async logout(@Context() { sessionId, currentUser }: GqlContext) {
    return await this.authService.logout(currentUser, sessionId);
  }

  // @UseInterceptors(OtpInvalidAttemptsLimiterInterceptor(ValidationMethodEnum.EMAIL))
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(() => GqlBooleanResponse)
  async verifyPasswordResetVerificationCode(
    @Args('input') input: VerifyForgetPasswordInput
  ) {
    return !!(await this.authService.verifyPasswordResetVerificationCode(
      input
    ));
  }

  // @UseInterceptors(OtpInvalidAttemptsLimiterInterceptor(ValidationMethodEnum.EMAIL))
  // @RequireAppCheck()
  @Throttle({
    default: { limit: 10, ttl: 60 * 1000, blockDuration: 60 * 60 * 1000 }
  }) // 10 requests per min or block for 1 hour
  @Mutation(returns => GqlBooleanResponse)
  async resetPasswordByEmail(@Args('input') input: ResetPasswordByEmailInput) {
    return await this.authService.resetPasswordByEmail(input);
  }

  // @UseGuards(AuthGuard)
  // @Mutation(returns => GqlBooleanResponse)
  // async updateFcmToken(
  //   @Args({ name: 'device', type: () => DeviceEnum }) device: DeviceEnum,
  //   @Args('fcmToken') fcmToken: string,
  //   @CurrentUser() currentUser: User
  // ) {
  //   return await this.authService.updateFcmToken(fcmToken, device, currentUser);
  // }

  // @UseInterceptors(OtpResendLimiterInterceptor(ValidationMethodEnum.EMAIL))
  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.USER)
  async changeEmail(
    @CurrentUser() currentUser: User,
    @Args('input') input: UpdateEmailInput
  ) {
    return await this.authService.changeUserEmail(currentUser, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlUserResponse)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  async changeEmailBoard(
    @CurrentUser() currentUser: User,
    @Args('input') input: UpdateEmailBoardInput
  ) {
    return await this.authService.changeEmailBoard(currentUser, input);
  }
}
