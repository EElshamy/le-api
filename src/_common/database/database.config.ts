import { SequelizeOptions } from 'sequelize-typescript';
import { env } from '../utils/env';
import { models } from './database.models';

export const config = (): SequelizeOptions => {
  return <SequelizeOptions>{
    username: <string>(<unknown>env.DB_USER),
    password: <string>(<unknown>env.DB_PASS),
    database:
      env.NODE_ENV === 'test' ?
        <string>(<unknown>env.TEST_DB_NAME)
      : <string>(<unknown>env.DB_NAME),
    host: <string>(<unknown>env.DB_HOST),
    port: <number>(<unknown>env.DB_PORT),
    dialect: 'postgres',
    // logging: sql => {
    //   console.log(sql);
    // },
    logging: false,

    pool: {
      max: Number(env.DB_POOL_MAX ?? 200),
      min: Number(env.DB_POOL_MIN ?? 5),
      acquire: Number(env.DB_POOL_ACQUIRE ?? 60000),
      idle: Number(env.DB_POOL_IDLE ?? 10000)
    },
    sync: {
      alter: false
      // env.NODE_ENV === 'development' ? true : false
    },
    // This approach to load models is incredibly faster than files matching
    models
  };
};
