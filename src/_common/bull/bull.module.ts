import { BullModule } from '@nestjs/bull';
import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WALLET_QUEUE } from '@src/payment/constants/payment.constants';
import { STRIPE_HOOKS_QUEUE } from '@src/payment/strategies/stripe/queue/stripe-hooks.processor';
import { Response } from 'express';
import IORedis from 'ioredis';

import { env } from '../utils/env';
import { QueueUIProvider } from './bull-board.provider';
import { GEIDEA_HOOKS_QUEUE } from '@src/payment/strategies/geidea/queue/geidea-hooks.processor';

let client, subscriber, bclient;
const queues = [
  BullModule.registerQueue({ name: 'leiaqa-mail' }),
  BullModule.registerQueue({ name: WALLET_QUEUE }),
  BullModule.registerQueue({
    name: STRIPE_HOOKS_QUEUE
  }),
  BullModule.registerQueue({
    name: GEIDEA_HOOKS_QUEUE
  }),
  BullModule.registerQueue({ name: 'Pdf' }),
  BullModule.registerQueue({ name: 'PricingCalcs' }),
  BullModule.registerQueue({ name: 'UpdateRatings' }),
  BullModule.registerQueue({ name: 'pusher' }),
  BullModule.registerQueue({ name: 'userViews' }),
  BullModule.registerQueue({ name: 'diplomaDeletion' })
];

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        prefix: 'leiaqa',
        createClient(type) {
          const connectionOptions = {
            host: configService.get('REDIS_HOST'),
            port: +configService.get('REDIS_PORT'),
            password: configService.get('REDIS_PASS'),
            ...(configService.get('REDIS_DATABASE_INDEX') !== undefined && {
              db: +configService.get('REDIS_DATABASE_INDEX')
            }),
            maxRetriesPerRequest: null,
            enableReadyCheck: false
          };

          switch (type) {
            case 'client': {
              if (!client) {
                client = new IORedis(connectionOptions);
                // Prevent MaxListenersExceededWarning on internal commander
                // client.setMaxListeners(1000);
              }
              return client;
            }
            case 'subscriber': {
              if (!subscriber) {
                subscriber = new IORedis(connectionOptions);
                // subscriber.setMaxListeners(1000);
              }
              return subscriber;
            }
            // case 'bclient': {
            //   // Reuse a single blocking client across all queues to avoid
            //   // creating many ioredis instances (prevents MaxListenersExceededWarning)
            //   if (!bclient) {
            //     bclient = new IORedis(connectionOptions);
            //     bclient.setMaxListeners(1000);
            //   }
            //   return bclient;
            // }
            default: {
              // Fallback for any other client types
              return new IORedis(connectionOptions);
            }
          }
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 }
        }
      })
    }),
    ...queues
  ],
  providers: [QueueUIProvider],
  exports: [...queues]
})
export class NestBullModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply((_, res: Response, next: any) => {
        if (env.NODE_ENV === 'production') return res.sendStatus(401);
        next();
      }, QueueUIProvider.router)
      .forRoutes('/admin/queues');
  }
}
