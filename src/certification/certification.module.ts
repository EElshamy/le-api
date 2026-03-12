import { S3Client } from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { S3Service } from '@src/_common/aws/s3/s3.service';
import { S3ClientToken } from '@src/_common/aws/s3/s3.type';
import { HelperService } from '@src/_common/utils/helper.service';
import { CartModule } from '@src/cart/cart.module';
import { DiplomaModule } from '@src/diploma/diplma.module';
import { UserModule } from '@src/user/user.module';
import * as https from 'https';
import { CertificationResolver } from './certification.resolver';
import { CertificationService } from './certification.service';
import { SpacesModule } from '@src/_common/digitalocean/spaces.module';
import { CertificationCrons } from './certification.crons';
import { NotificationModule } from '@src/notification/notification.module';

@Global()
@Module({
  imports: [
    CartModule,
    UserModule,
    SpacesModule,
    NotificationModule
  ],
  providers: [
    {
      provide: S3ClientToken,
      useFactory: (configService: ConfigService): S3Client => {
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
    CertificationService,
    CertificationResolver,
    S3Service,
    HelperService,
    CertificationCrons
  ],
  exports: [CertificationService]
})
export class CertificationModule {}
