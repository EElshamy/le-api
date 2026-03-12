import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { FaqFactory, FaqType } from '@src/faq/faq.factory';
import { Faq } from '@src/faq/models/faq.model';
import { FaqPermissionsEnum } from '@src/security-group/security-group-permissions';
import { SecurityGroupFactory } from '@src/security-group/security-group.factory';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { UserFactory } from '@src/user/factories/user.factory';
import { User } from '@src/user/models/user.model';
import { SUPER_ADMIN_GROUP } from '../constants';

interface FaqGenerateData {
  overrideFaq?: object;
  overrideInput?: object;
  overrideSecurityGroup?: object;
  admin?: User;
}

const securityGroupRepo = new (buildRepository(
  SecurityGroup
))() as IRepository<SecurityGroup>;

export async function generateFaqData(overrideData: FaqGenerateData = {}) {
  await securityGroupRepo.rawDelete();
  const adminRole = await SecurityGroupFactory(false, {
    groupName: SUPER_ADMIN_GROUP,
    permissions: [FaqPermissionsEnum.CREATE_FAQS],
    ...(overrideData.overrideSecurityGroup || {})
  });
  const admin =
    overrideData.admin ||
    ((await UserFactory(false, { securityGroupId: adminRole.id })) as User);

  const input = (await FaqFactory(true, {
    ...(overrideData.overrideInput || {})
  })) as FaqType;

  const faq = (await FaqFactory(false, {
    isActive: true,
    ...(overrideData.overrideFaq || {})
  })) as Faq;

  return { input, faq, adminRole, admin };
}
