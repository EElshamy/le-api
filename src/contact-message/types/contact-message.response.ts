import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { ContactMessage } from '../models/contact-message.model';

export const GqlContactMessageResponse =
  generateGqlResponseType(ContactMessage);
export const GqlContactMessagesArrayResponse = generateGqlResponseType(
  Array(ContactMessage),
  true
);
export const GqlContactMessagesResponse = generateGqlResponseType(
  Array(ContactMessage)
);
