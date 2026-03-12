import { createUnionType } from '@nestjs/graphql';
import { ContactMessage } from '@src/contact-message/models/contact-message.model';
import { NotExistRecord } from './notification.type';

export const NotificationParentUnion = createUnionType({
  name: 'NotificationParentUnion',
  types: () => [ContactMessage, NotExistRecord],
  resolveType(value: ContactMessage | NotExistRecord) {
    if ((<ContactMessage>value).contactReason !== undefined)
      return ContactMessage;
    return NotExistRecord;
  }
});
