import { Module } from '@nestjs/common';
import { HelperModule } from '@src/_common/utils/helper.module';
import { CartService } from '@src/cart/services/cart.service';
import { PaymentModule } from '@src/payment/payment.module';
import { UserModule } from '@src/user/user.module';
import { LimiterModule } from '../_common/limiter/limiter.module';
import { MailModule } from '../_common/mail/mail.module';
import { LecturerModule } from '../lecturer/lecturer.module';
import { UserSessionModule } from '../user-sessions/user-sessions.module';
import { UserVerificationCodeModule } from '../user-verification-code/user-verification-code.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
// import { PaymentModule } from '@src/payment/payment.module';

@Module({
  imports: [
    HelperModule,
    UserModule,
    UserVerificationCodeModule,
    UserSessionModule,
    LimiterModule,
    MailModule,
    LecturerModule,
    PaymentModule
  ],
  providers: [AuthService, AuthResolver, CartService],
  exports: [AuthService]
})
export class AuthModule {}
