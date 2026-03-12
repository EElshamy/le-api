import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { ContactMessagePermissionsEnum } from '@src/security-group/security-group-permissions';
import { NOT_EXISTED_UUID } from '../constants';
import { CONTACT_MESSAGE_BOARD } from '../graphql/contact-message';
import { post } from '../request';
import { generateContactMessageData } from './generate-contact-message-data';
import { rollbackDbForContactMessage } from './rollback-for-contact-message';

describe('Contact message suite case', () => {
  afterEach(async () => {
    await rollbackDbForContactMessage();
  });

  it('return_error_if_un_authorized', async () => {
    const res = await post(CONTACT_MESSAGE_BOARD, {
      contactMessageId: NOT_EXISTED_UUID
    });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { admin } = await generateContactMessageData({
      overrideSecurityGroup: {
        permissions: [ContactMessagePermissionsEnum.UPDATE_CONTACT_MESSAGES]
      }
    });
    const res = await post(
      CONTACT_MESSAGE_BOARD,
      {
        contactMessageId: NOT_EXISTED_UUID
      },
      admin.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_contact_message_not_exist', async () => {
    const { admin } = await generateContactMessageData({});
    const res = await post(
      CONTACT_MESSAGE_BOARD,
      {
        contactMessageId: NOT_EXISTED_UUID
      },
      admin.token
    );
    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.CONTACT_MESSAGE_NOT_EXIST
    );
  });

  it('contact_message_board', async () => {
    const { admin, contactMessage } = await generateContactMessageData({});
    const res = await post(
      CONTACT_MESSAGE_BOARD,
      {
        contactMessageId: contactMessage.id
      },
      admin.token
    );
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.name).toBe(contactMessage.name);
    expect(res.body.data.response.data.email).toBe(contactMessage.email);
    expect(res.body.data.response.data.phone).toBe(contactMessage.phone);
    expect(res.body.data.response.data.contactReason).toBe(
      contactMessage.contactReason
    );
  });
});
