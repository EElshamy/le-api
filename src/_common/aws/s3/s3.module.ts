import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3ClientToken } from './s3.type';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as https from 'https';

@Module({
  providers: [
    {
      provide: S3ClientToken,
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY')
          },
          region: configService.get('S3_REGION'),
          maxAttempts: 3,
          requestHandler: new NodeHttpHandler({
            connectionTimeout: 10000, // 10 seconds connection timeout
            socketTimeout: 120000, // 2 minutes socket timeout
            httpsAgent: new https.Agent({
              maxSockets: 100 // Set the maximum number of simultaneous connections
            })
          })
        });
      },
      inject: [ConfigService]
    },
    S3Service
  ],
  exports: [S3Service]
})
export class S3Module {}
