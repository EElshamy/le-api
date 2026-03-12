import { Global, Injectable } from '@nestjs/common';
import fireBaseAdmin, { ServiceAccount } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';

@Injectable()
export class AppCheckService {
  constructor(private readonly configService: ConfigService) {
    if (!fireBaseAdmin.apps.length) {
      fireBaseAdmin.initializeApp({
        credential: fireBaseAdmin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')
        }),
        databaseURL: this.configService.get('FIREBASE_DB_URL')
      });
    }
  }

  async validateToken(token: string) {
    try {
      const claims = await fireBaseAdmin.appCheck().verifyToken(token, {
        consume: true
      });

      if (claims.alreadyConsumed) {
        throw new BaseHttpException(
          ErrorCodeEnum.ALREADY_CONSUMED_FIREBASE_APP_CHECK,
          {
            message: 'Already consumed FireBaseAppCheckToken'
          }
        );
      }

      return claims;
    } catch (err) {
      if (err instanceof BaseHttpException) throw err;

      throw new BaseHttpException(
        ErrorCodeEnum.FAILED_TO_VALIDATE_FIREBASE_APP_CHECK,
        {
          message: 'failed to validate X-Firebase-AppCheck'
        }
      );
    }
  }
}
