import { Module } from '@nestjs/common';
import { UserVerificationCodeService } from './user-verification-code.service';

@Module({
  providers: [UserVerificationCodeService],
  exports: [UserVerificationCodeService]
})
export class UserVerificationCodeModule {}
