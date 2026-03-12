import { GetProviderUseInfoInput } from '../social-auth.type';
import { ISocialProviderInfoFetcher } from './provider-validator.interface';
import { Injectable } from '@nestjs/common';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AppleInfoFetcher implements ISocialProviderInfoFetcher {
  async getUserInfo(input: GetProviderUseInfoInput) {
    try {
      return this.getUserProfileByIdToken(input.providerToken);
    } catch (error) {
      console.error('Error decoding Apple ID token:', error);
      throw new BaseHttpException(ErrorCodeEnum.ERROR_VALIDATING_USER_INFO);
    }
  }

  private getUserProfileByIdToken(idToken: string) {
    const decodedToken = jwt.decode(idToken) as { sub: string; email?: string };

    if (!decodedToken || !decodedToken.sub) {
      throw new BaseHttpException(ErrorCodeEnum.ERROR_VALIDATING_USER_INFO);
    }

    return {
      id: decodedToken.sub,
      email: decodedToken.email ?? ''
    };
  }
}
