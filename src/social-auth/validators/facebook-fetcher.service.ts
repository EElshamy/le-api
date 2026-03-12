import axios from 'axios';
import { GetProviderUseInfoInput } from '../social-auth.type';
import { ISocialProviderInfoFetcher } from './provider-validator.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
@Injectable()
export class FacebookInfoFetcher implements ISocialProviderInfoFetcher {
  constructor(private configService: ConfigService) {}
  clientSecret = this.configService.get('FACEBOOK_CLIENT_SECRET');
  clientId = this.configService.get('FACEBOOK_CLIENT_ID');
  redirectUri = this.configService.get('FACEBOOK_REDIRECT_URI');
  SCOPES = ['email', 'profile'];
  async getUserInfo(input: GetProviderUseInfoInput) {
    try {
      return await this.getUserProfileByToken(input.providerToken);
    } catch (err) {
      throw new BaseHttpException(ErrorCodeEnum.ERROR_VALIDATING_USER_INFO);
    }
  }
  // ** input.providerToken .. i consider it as a code that would be used to get token for getting user info
  async getUserProfileByToken(authToken: string) {
    const userInfo = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email ,first_name,last_name',
        access_token: authToken
      }
    });
    return userInfo.data;
  }
}
