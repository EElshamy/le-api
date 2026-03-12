import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import {
  ContactMessageFactory,
  ContactMessageType
} from '@src/contact-message/contact-message.factory';
import { ContactMessage } from '@src/contact-message/contact-message.model';
import { ContactMessagePermissionsEnum } from '@src/security-group/security-group-permissions';
import { SecurityGroupFactory } from '@src/security-group/security-group.factory';
import { SecurityGroup } from '@src/security-group/security-group.model';
import { UserFactory } from '@src/user/factories/user.factory';
import { User } from '@src/user/models/user.model';
import { SUPER_ADMIN_GROUP } from '../constants';

interface ContactMessageGenerateData {
  overrideContactMessage?: object;
  overrideInput?: object;
  overrideSecurityGroup?: object;
  admin?: User;
}

const securityGroupRepo = new (buildRepository(
  SecurityGroup
))() as IRepository<SecurityGroup>;

export async function generateContactMessageData(
  overrideData: ContactMessageGenerateData = {}
) {
  await securityGroupRepo.rawDelete();
  const adminRole = await SecurityGroupFactory(false, {
    groupName: SUPER_ADMIN_GROUP,
    permissions: [ContactMessagePermissionsEnum.READ_CONTACT_MESSAGES],
    ...(overrideData.overrideSecurityGroup || {})
  });
  const admin =
    overrideData.admin ||
    ((await UserFactory(false, { securityGroupId: adminRole.id })) as User);

  const input = (await ContactMessageFactory(true, {
    ...(overrideData.overrideInput || {})
  })) as ContactMessageType;

  const contactMessage = (await ContactMessageFactory(false, {
    ...(overrideData.overrideContactMessage || {})
  })) as ContactMessage;

  return { input, contactMessage, adminRole, admin };
}
