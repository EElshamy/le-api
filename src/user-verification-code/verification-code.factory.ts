import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { addMinutes } from 'date-fns';
import { UserVerificationCodeUseCaseEnum } from '../user/user.enum';
import { UserVerificationCode } from './user-verification-code.model';

const userVerificationCodeRepo = new (buildRepository(
  UserVerificationCode
))() as IRepository<UserVerificationCode>;

type UserVerificationCodeType = {
  id?: string;
  useCase: UserVerificationCodeUseCaseEnum;
  code: string;
  expiryDate: Date;
  userId: string;
};

function buildParams(input = <any>{}): UserVerificationCodeType {
  return {
    useCase: input.useCase,
    code: input.code,
    expiryDate: input.expiryDate || addMinutes(new Date(), 10),
    userId: input.userId
  };
}

export const UserVerificationCodeFactory = async (
  returnInputOnly: boolean = false,
  input = <any>{}
): Promise<UserVerificationCode | UserVerificationCodeType> => {
  const params = buildParams(input);

  if (returnInputOnly) return params;
  return await userVerificationCodeRepo.createOne(params);
};
