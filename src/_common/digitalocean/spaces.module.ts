import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as https from 'https';
import { SpaceClientToken } from './spaces.type';
import { DigitalOceanSpacesService } from './services/spaces.service';

@Module({
  providers: [
    {
      provide: SpaceClientToken,
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          credentials: {
            accessKeyId: configService.get('DIGITALOCEAN_SPACES_KEY'),
            secretAccessKey: configService.get('DIGITALOCEAN_SPACES_SECRET')
          },
          region: configService.get('DIGITALOCEAN_SPACES_REGION'),
          endpoint: configService.get('DIGITALOCEAN_SPACES_ENDPOINT'),
          forcePathStyle: false,
          maxAttempts: 3,
          requestHandler: new NodeHttpHandler({
            connectionTimeout: 10000,
            socketTimeout: 120000,
            httpsAgent: new https.Agent({
              maxSockets: 100
            })
          })
        });
      },
      inject: [ConfigService]
    },
    DigitalOceanSpacesService
  ],
  exports: [DigitalOceanSpacesService]
})
export class SpacesModule {}
