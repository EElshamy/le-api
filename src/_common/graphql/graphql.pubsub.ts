import { RedisPubSub } from 'graphql-redis-subscriptions';
import { env } from '../utils/env';

// Replace Graphql subscription pubsub with Redis pubsub
// https://stackoverflow.com/questions/43752073/graphql-subscriptions-max-listeners-exceeded-warning
export const redisPubSub = new RedisPubSub({
  connection: {
    connectTimeout: 200000,
    host: env.REDIS_HOST,
    port: +env.REDIS_PORT,
    password: env.REDIS_PASS,
    ...(env.REDIS_DATABASE_INDEX !== undefined && { db: +env.REDIS_DATABASE_INDEX }),
    retryStrategy: (times: number) => Math.min(times * 50, 2000)
  }
});

export const PubSub = {
  provide: 'PUB_SUB',
  useValue: redisPubSub
};
