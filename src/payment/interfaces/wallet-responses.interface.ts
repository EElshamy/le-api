import { generateGqlResponseType } from '../../_common/graphql/graphql-response.type';
import { Wallet } from '../models/wallet.model';
import { AllWalletsBalanceCombined, WalletData } from './wallet-data.object';

export const GqlWalletResponse = generateGqlResponseType(Wallet);
export const GqlWalletDataResponse = generateGqlResponseType(WalletData);
export const GqlWalletsPaginatedResponse = generateGqlResponseType(
  Array(Wallet)
);
export const GqlWalletsResponse = generateGqlResponseType(Array(Wallet), true);

export const GqlAllWalletsBalanceCombined = generateGqlResponseType(
  AllWalletsBalanceCombined
);
