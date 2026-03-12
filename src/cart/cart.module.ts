import { Module } from '@nestjs/common';
import { PaymentModule } from '@src/payment/payment.module';
import { CartResolver } from './resolvers/cart.resolver';
import { PurchaseResolver } from './resolvers/purchase.resolver';
import { CartService } from './services/cart.service';
import { PurchaseService } from './services/purchase.service';
import { PusherModule } from '@src/_common/pusher/pusher.module';

@Module({
  imports: [PaymentModule, PusherModule],
  providers: [CartResolver, CartService, PurchaseResolver, PurchaseService],
  exports: [CartService, PurchaseService]
})
export class CartModule {}
