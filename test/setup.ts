require('ts-node/register');

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import { Sequelize } from 'sequelize';
import { SEQUELIZE_INSTANCE_NEST_DI_TOKEN } from 'sequelize-transactional-typescript';

export let app: INestApplication;
export let sequelizeProvider: Sequelize;

module.exports = async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  }).compile();
  app = moduleRef.createNestApplication();
  sequelizeProvider = (await app.get(SEQUELIZE_INSTANCE_NEST_DI_TOKEN, {
    strict: false
  })) as Sequelize;

  await app.init();
};
