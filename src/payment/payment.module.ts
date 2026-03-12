import { Module } from '@nestjs/common';
import { S3Module } from '@src/_common/aws/s3/s3.module';
import { HelperModule } from '@src/_common/utils/helper.module';
import { PAYMENT_STRATEGY } from './constants/payment.constants';
import { CouponsCron } from './jobs/coupon.crons';
import { WalletsCron } from './jobs/wallet.crons';
import { CouponResolver } from './presentation/coupon.resolver';
import { PaymentHooksController } from './presentation/payment-hooks.controller';
import { TransactionLogResolver } from './presentation/transaction-logs.resolver';
import { TransactionResolver } from './presentation/transaction.resolver';
import { WalletResolver } from './presentation/wallet.resolver';
import { CouponService } from './services/coupon.service';
import { PaymentService } from './services/payment.service';
import { RevenueShareService } from './services/revenue.service';
import { TransactionLogService } from './services/transaction-logs.service';
import { TransactionService } from './services/transaction.service';
import { WalletService } from './services/wallet.service';
import { StripeHooksProcessor } from './strategies/stripe/queue/stripe-hooks.processor';
import { StripeQueueService } from './strategies/stripe/queue/stripe-queue.service';
import { StripeStrategy } from './strategies/stripe/stripe.service';
import { TransactionsProgramsTypesLoader } from './loaders/transaction-programs-types.loader';
import { GeideaHooksProcessor } from './strategies/geidea/queue/geidea-hooks.processor';
import { GeideaQueueService } from './strategies/geidea/queue/geidea-queue.service';
import { GeideaStrategy } from './strategies/geidea/geidea.service';
import { SpacesModule } from '@src/_common/digitalocean/spaces.module';
import { TransactionPurchaseItemForAdminResolver } from './presentation/transaction-purchase.resolver';
import { TransactionsUserLoader } from './loaders/transaction-user.loader';
import { TransactionsLecturersLoader } from './loaders/transaction-lecturers.loader';

@Module({
  imports: [HelperModule, S3Module , SpacesModule],
  controllers: [PaymentHooksController],
  providers: [
    RevenueShareService,
    WalletService,
    {
      provide: PAYMENT_STRATEGY,
      useClass: GeideaStrategy
    },
    StripeQueueService,
    PaymentService,
    RevenueShareService,
    TransactionResolver,
    TransactionService,
    TransactionLogResolver,
    TransactionPurchaseItemForAdminResolver,
    TransactionLogService,
    WalletResolver,
    WalletService,
    WalletsCron,
    CouponsCron,
    CouponResolver,
    CouponService,
    StripeHooksProcessor,
    GeideaHooksProcessor,
    GeideaQueueService,
    TransactionsProgramsTypesLoader,
    TransactionsUserLoader,
    TransactionsLecturersLoader
  ],
  exports: [
    RevenueShareService,
    TransactionService,
    WalletService,
    PaymentService,
    {
      provide: PAYMENT_STRATEGY,
      useClass: GeideaStrategy
    }
  ]
})
export class PaymentModule {}
