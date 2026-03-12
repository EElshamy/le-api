import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { ContactMessagePermissionsEnum } from '@src/security-group/security-group-permissions';
import { NOT_EXISTED_UUID } from '../constants';
import { DELETE_CONTACT_MESSAGE_BOARD } from '../graphql/contact-message';
import { post } from '../request';
import { generateContactMessageData } from './generate-contact-message-data';
import { rollbackDbForContactMessage } from './rollback-for-contact-message';

describe('Delete contact message board suite case', () => {
  afterEach(async () => {
    await rollbackDbForContactMessage();
  });
  it('return_error_if_un_authorized', async () => {
    const res = await post(DELETE_CONTACT_MESSAGE_BOARD, {
      contactMessageId: NOT_EXISTED_UUID
    });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { admin } = await generateContactMessageData();
    const res = await post(
      DELETE_CONTACT_MESSAGE_BOARD,
      {
        contactMessageId: NOT_EXISTED_UUID
      },
      admin.token
    );

    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_contact_message_not_exist', async () => {
    const { admin } = await generateContactMessageData({
      overrideSecurityGroup: {
        permissions: [ContactMessagePermissionsEnum.DELETE_CONTACT_MESSAGES]
      }
    });
    const res = await post(
      DELETE_CONTACT_MESSAGE_BOARD,
      {
        contactMessageId: NOT_EXISTED_UUID
      },
      admin.token
    );
    expect(res.body.data.response.code).toBe(
      ErrorCodeEnum.CONTACT_MESSAGE_NOT_EXIST
    );
  });

  it('delete_contact_message', async () => {
    const { admin, contactMessage } = await generateContactMessageData({
      overrideSecurityGroup: {
        permissions: [ContactMessagePermissionsEnum.DELETE_CONTACT_MESSAGES]
      },
      overrideContactMessage: { isResolved: false }
    });
    const res = await post(
      DELETE_CONTACT_MESSAGE_BOARD,
      { contactMessageId: contactMessage.id },
      admin.token
    );

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data).toBe(true);
  });
});
