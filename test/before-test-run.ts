import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module';

import { Sequelize } from 'sequelize';
// import { networkInterfaceInstance } from './subscription-client';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';
// import { redisPubSub } from '@src/_common/graphql/graphql.pubsub';

export let app: INestApplication;
let sequelizeProvider: Sequelize;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  }).compile();
  app = moduleRef.createNestApplication();
  sequelizeProvider = await app.get(SEQUELIZE_INSTANCE_NEST_DI_TOKEN, {
    strict: false
  });
  await app.init();
}, 100000);

afterAll(async done => {
  // await redisPubSub?.close();
  // if (networkInterfaceInstance) networkInterfaceInstance.close();
  await sequelizeProvider.close();
  await app.close();
  global.gc && global.gc();
  done();
});
