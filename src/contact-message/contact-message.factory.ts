import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { ContactReasonEnum } from './enums/contact-message.enum';
import { ContactMessage } from './models/contact-message.model';

const contactMessageRepo = new (buildRepository(
  ContactMessage
))() as IRepository<ContactMessage>;

export type ContactMessageType = {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  contactReason: ContactReasonEnum;
  message: string;
  resolvedAt?: Date;
};

function buildParams(
  input = <any>{},
  returnInputOnly: boolean
): ContactMessageType {
  return {
    name: input.name || faker.name.firstName(),
    email: input.email || faker.internet.email(),
    phone:
      input.phone ||
      faker.phone.number(
        `+20${faker.helpers.arrayElement([11, 12, 10])}########`
      ),
    contactReason:
      input.contactReason ||
      faker.helpers.arrayElement([
        ContactReasonEnum.ACCOUNT_ASSISTANCE,
        ContactReasonEnum.CERTIFICATION_AND_ACCREDITATION_INQUIRIES,
        ContactReasonEnum.COLLABORATION_AND_PARTNERSHIP_INQUIRIES,
        ContactReasonEnum.FEEDBACK_AND_SUGGESTIONS,
        ContactReasonEnum.TECHNICAL_ISSUE
      ]),
    message: input.message || faker.name.jobDescriptor(),
    ...(!returnInputOnly && { resolvedAt: input.resolvedAt })
  };
}

export const ContactMessageFactory = async (
  returnInputOnly: boolean = false,
  input = <any>{}
): Promise<ContactMessage | ContactMessageType> => {
  const params = buildParams(input, returnInputOnly);
  if (returnInputOnly) return params;
  return await contactMessageRepo.createOne(params);
};

export const ContactMessagesFactory = async (
  count: number = 10,
  input = <any>{}
): Promise<ContactMessage[]> => {
  let contactMessages = [];
  for (let i = 0; i < count; i++)
    contactMessages.push(buildParams(input, false));
  return await contactMessageRepo.bulkCreate(contactMessages);
};
