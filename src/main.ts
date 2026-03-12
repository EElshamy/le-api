import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EventEmitter } from 'events';
import * as compression from 'compression';
import * as express from 'express';
import { rateLimit } from 'express-rate-limit';
import { existsSync, mkdirSync, writeFile } from 'fs';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { initializeSequelizeWithTransactionalContext } from 'sequelize-transactional-typescript';
import { env } from './_common/utils/env';
import { AppModule } from './app.module';
const helmet = require('helmet');

async function bootstrap() {
  // Increase global max listeners to prevent noisy MaxListenersExceededWarning
  // EventEmitter.defaultMaxListeners = 1000;
  initializeSequelizeWithTransactionalContext();
  if (env.NODE_ENV === 'production') {
    const dir = 'logs';
    if (!existsSync(dir)) {
      mkdirSync(dir, {
        recursive: true
      });
      writeFile('logs/logs.out', '', (err: any) => {
        if (err) console.log(err);
      });
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // cors: {
    //   origin: (origin, callback) => {
    //     // Allow non-browser requests like Postman (origin === undefined)
    //     if (!origin || allowedOrigins.includes(origin)) {
    //       callback(null, true);
    //     } else {
    //       callback(new Error('Not allowed by CORS'));
    //     }
    //   },
    //   credentials: true
    // },
    cors: { origin: '*' },
    rawBody: true
  });

  // // app.use(express.json());
  // app.useBodyParser('text');

  app.use(
    helmet({
      // contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
      // To fix playground
    })
  );

  // https://www.apollographql.com/docs/apollo-server/migration#doubly-escaped-variables-and-extensions-in-requests
  app.use((req, res, next) => {
    if (req.body?.variables && typeof req.body?.variables === 'string') {
      try {
        req.body.variables = JSON.parse(req.body.variables);
      } catch (e) {
        // https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#json-parsing-failure
        res.status(400).send(e instanceof Error ? e.message : e);
      }
    }
    next();
  });

  // if (env.NODE_ENV === 'production')
  // app.use(
  //   rateLimit({
  //     windowMs: 1 * 60 * 1000, // 1 minute
  //     max: 100 // Limit each IP to 100 requests per windowMs
  //   })
  // );
  app.use(
    '/graphql',
    graphqlUploadExpress({ maxFileSize: 50 * 1024 * 1024, maxFiles: 10 })
  );

  app.use(compression());

  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString(); // Add raw body
      }
    })
  );

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  await app.listen(env.PORT);

  new Logger('NestApplication').log(`server is running on port ${env.PORT}`);
}

bootstrap();
