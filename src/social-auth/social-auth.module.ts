import { Module } from '@nestjs/common';
import { CartModule } from '@src/cart/cart.module';
import { AuthModule } from '../auth/auth.module';
import { UserSessionModule } from '../user-sessions/user-sessions.module';
import { UserModule } from '../user/user.module';
import { SocialAuthUserFieldsResolver } from './resolvers/social-auth-user-fields.resolver';
import { SocialAuthResolver } from './resolvers/social-auth.resolver';
import { SocialAuthDataloader } from './social-auth.dataloader';
import { SocialAuthService } from './social-auth.service';
import { AppleInfoFetcher } from './validators/apple-fetcher.service';
import { FacebookInfoFetcher } from './validators/facebook-fetcher.service';
import { GoogleInfoFetcher } from './validators/google-fetcher.service';

@Module({
  imports: [AuthModule, UserModule, UserSessionModule, CartModule],
  providers: [
    SocialAuthService,
    SocialAuthResolver,
    SocialAuthUserFieldsResolver,
    SocialAuthDataloader,
    GoogleInfoFetcher,
    FacebookInfoFetcher,
    AppleInfoFetcher
  ],
  exports: [SocialAuthDataloader]
})
export class SocialAuthModule {}
