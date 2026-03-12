import { env } from '../utils/env';

module.exports = {
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.NODE_ENV === 'test' ? env.TEST_DB_NAME : env.DB_NAME,
  host: env.DB_HOST,
  port: +env.DB_PORT,
  dialect: 'postgres'
};
