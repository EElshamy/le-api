// import { networkInterfaceInstance } from './subscription-client';
import { redisPubSub } from '@src/_common/graphql/graphql.pubsub';
import { app, sequelizeProvider } from './setup';

module.exports = async () => {
  if (redisPubSub.getPublisher().status === 'connecting') redisPubSub.close();
  // if (networkInterfaceInstance) networkInterfaceInstance.terminate();
  await sequelizeProvider.close();
  await app.close();
  global.gc && global.gc();
};
