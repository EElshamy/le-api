import {
  Controller,
  Headers,
  Inject,
  Post,
  RawBodyRequest,
  Req
} from '@nestjs/common';
import { PAYMENT_STRATEGY } from '../constants/payment.constants';
import { IPaymentStrategy } from '../interfaces/payment-strategy.interface';

@Controller('payment-hooks')
export class PaymentHooksController {
  constructor(
    @Inject(PAYMENT_STRATEGY) private readonly paymentStrategy: IPaymentStrategy
  ) {}

  @Post('/stripe/webhook')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string
  ): Promise<void> {
    console.log('stripe webhook');
    await this.paymentStrategy.handlePaymentEvent(req, sig);
  }

  @Post('/geidea/webhook')
  async geideaWebhook(
    @Req() req: RawBodyRequest<Request>
  ): Promise<void> {
    console.log('geidea webhook 🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁🦁');
    await this.paymentStrategy.handlePaymentEvent(req);
  }
}
