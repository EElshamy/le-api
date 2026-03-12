import { GetProviderUseInfoInput } from '../social-auth.type';
import { ISocialProviderInfoFetcher } from './provider-validator.interface';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GoogleInfoFetcher implements ISocialProviderInfoFetcher {
  private client: OAuth2Client;
  private readonly httpService: HttpService = new HttpService();
  private webClientId: string =
    this.configService.get<string>('GOOGLE_CLIENT_ID');
  private AndroidClientId: string = this.configService.get<string>(
    'GOOGLE_CLIENT_ID_ANDROID'
  );
  private AndroidNewClientId: string = this.configService.get<string>(
    'GOOGLE_CLIENT_ID_ANDROID_NEW'
  );
  private iOSClientId: string = this.configService.get<string>(
    'GOOGLE_CLIENT_ID_IOS'
  );

  constructor(private readonly configService: ConfigService) {
    // this.client = new OAuth2Client(this.clientId);
    this.client = new OAuth2Client()
  }
  async getUserInfo(input: GetProviderUseInfoInput) {
    try {
      console.log('input.providerToken: ', input.providerToken);

      return await this.getUserProfileByIdToken(input.providerToken);
    } catch (err) {
      console.log('err 💥💥💥: ', err);
      throw new BaseHttpException(ErrorCodeEnum.ERROR_VALIDATING_USER_INFO);
    }
  }

  // async getUserInfo(input: GetProviderUseInfoInput){
  //   try {
  //     const { providerToken } = input;
  //     const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${providerToken}`;
  //     const response = await lastValueFrom(this.httpService.get(url));

  //     return {
  //       id: response.data.sub,
  //       email: response.data.email,
  //     };
  //   } catch (error) {
  //     console.log('error 💥💥💥 :' , error)
  //     throw new BaseHttpException(ErrorCodeEnum.ERROR_VALIDATING_USER_INFO);
  //   }
  // }

  async getUserProfileByIdToken(idToken: string) {
    const ticket = await this.client.verifyIdToken({
      idToken
      // audience: [this.webClientId, this.AndroidClientId, this.iOSClientId]
      // audience: this.clientId
    });

    const payload = ticket.getPayload();

    if (!payload) return null;

    return {
      id: payload.sub,
      email: payload.email
    };
  }
}
