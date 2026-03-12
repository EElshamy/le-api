import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { ContactReasonEnum } from '@src/contact-message/enums/contact-message.enum';
import { ContactMessagePermissionsEnum } from '@src/security-group/security-group-permissions';
import { CONTACT_MESSAGES_BOARD } from '../graphql/contact-message';
import { post } from '../request';
import { generateContactMessageData } from './generate-contact-message-data';
import { rollbackDbForContactMessage } from './rollback-for-contact-message';

describe('Contact messages board suite case', () => {
  afterEach(async () => {
    await rollbackDbForContactMessage();
  });

  it('return_error_if_un_authorized', async () => {
    const res = await post(CONTACT_MESSAGES_BOARD, {
      filter: { isResolved: true }
    });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { admin } = await generateContactMessageData({
      overrideSecurityGroup: {
        permissions: [ContactMessagePermissionsEnum.CREATE_CONTACT_MESSAGES]
      }
    });
    const res = await post(
      CONTACT_MESSAGES_BOARD,
      { filter: { isResolved: true } },
      admin.token
    );
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('contact_messages_board', async () => {
    const { admin } = await generateContactMessageData({
      overrideContactMessage: {
        isResolved: false,
        contactReason: ContactReasonEnum.COMPLAINT
      }
    });
    const res = await post(
      CONTACT_MESSAGES_BOARD,
      {
        filter: {
          isResolved: false,
          contactReason: ContactReasonEnum.COMPLAINT
        }
      },
      admin.token
    );
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.items.length).toBe(1);
    expect(res.body.data.response.data.items[0].resolvedAt).toBeNull();
    expect(res.body.data.response.data.items[0].contactReason).toBe(
      ContactReasonEnum.COMPLAINT
    );
  });
});
