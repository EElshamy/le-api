import { Module } from '@nestjs/common';
import { UploaderModule } from '@src/_common/uploader/uploader.module';
import { HelperModule } from '@src/_common/utils/helper.module';
import { CartService } from '@src/cart/services/cart.service';
import { PurchaseService } from '@src/cart/services/purchase.service';
import { PaymentModule } from '@src/payment/payment.module';
import { PolicyModule } from '@src/policy/policy.module';
import { ReviewService } from '@src/reviews/review.service';
import { SystemConfigModule } from '@src/system-configuration/system-config.module';
import { ActiveUsersModule } from '../user-activity/user-activity.module';
import { UserSessionModule } from '../user-sessions/user-sessions.module';
import { UserLoaders } from './loaders/user.loader';
import { UserResolver } from './resolvers/user.resolver';
import { UserService } from './services/user.service';
import { UserTransformer } from './transformers/user.transformer';
import { UserDataloader } from './user.dataloader';

@Module({
  imports: [
    HelperModule,
    UploaderModule,
    UserSessionModule,
    ActiveUsersModule,
    PaymentModule,
    SystemConfigModule,
    PolicyModule,
    UploaderModule
  ],
  providers: [
    UserService,
    ReviewService,
    CartService,
    PurchaseService,
    UserTransformer,
    UserResolver,
    UserDataloader,
    UserLoaders,
  ],
  exports: [UserService, UserTransformer, UserDataloader]
})
export class UserModule {}
