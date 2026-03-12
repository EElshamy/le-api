import { GetProviderUseInfoInput, ProviderUserData } from '../social-auth.type';

export interface ISocialProviderInfoFetcher {
  getUserInfo(input: GetProviderUseInfoInput): Promise<ProviderUserData>;
}
