import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { GEIDEA_HOOKS_QUEUE } from '@src/payment/strategies/geidea/queue/geidea-hooks.processor';
// import { WALLET_QUEUE } from ;
import { STRIPE_HOOKS_QUEUE } from '@src/payment/strategies/stripe/queue/stripe-hooks.processor';
import { Queue } from 'bull';

@Injectable()
export class QueueUIProvider {
  static router = null;
  constructor(
    @InjectQueue('leiaqa-mail') private mailQueue: Queue,
    // @InjectQueue(WALLET_QUEUE) private walletQueue: Queue,
    @InjectQueue(STRIPE_HOOKS_QUEUE) private stripeQueue: Queue,
    @InjectQueue(GEIDEA_HOOKS_QUEUE) private geideaQueue: Queue
    // @InjectQueue(WALLET_QUEUE) private walletQueue: Queue
  ) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [
        new BullAdapter(this.mailQueue),
        // new BullAdapter(this.walletQueue),
        new BullAdapter(this.stripeQueue),
        new BullAdapter(this.geideaQueue)
      ],
      serverAdapter: serverAdapter
    });
    QueueUIProvider.router = serverAdapter.getRouter();
  }
}
