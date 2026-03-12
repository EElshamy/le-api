import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { GqlStringResponse } from '@src/_common/graphql/graphql-response.type';
import {
  CurrentUser,
  getCurrentUserSessionId
} from '@src/auth/auth-user.decorator';
import { AuthGuard } from '@src/auth/auth.guard';
import { User } from '@src/user/models/user.model';
import { Transactional } from 'sequelize-transactional-typescript';
import { BuyNowInput } from '../inputs/buy-now.input';
import { PurchaseItem } from '../models/purchase-item.model';
import { Purchase } from '../models/purchase.model';
import { PurchaseService } from '../services/purchase.service';
import { GqlPaymetIntentResponse } from './cart.resolver';

@Resolver(() => Purchase)
export class PurchaseResolver {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Transactional()
  @UseGuards(AuthGuard)
  @Mutation(() => GqlPaymetIntentResponse)
  async buyNow(
    @Args('input') input: BuyNowInput,
    @CurrentUser() currentUser: User,
    @getCurrentUserSessionId() sessionId: string
  ): Promise<{
    paymentIntentId?: string;
    paymentIntentSecretKey?: string;
    paymentLink?: string;
    transactionCode? : string
  }> {
    return await this.purchaseService.buyNow(input, currentUser, sessionId);
  }

  @ResolveField(() => [PurchaseItem])
  async purchaseItems(@Parent() purchase: Purchase): Promise<PurchaseItem[]> {
    return await this.purchaseService.getPurchaseItems(purchase.id);
  }
}
