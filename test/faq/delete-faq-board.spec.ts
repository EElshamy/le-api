import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { FaqPermissionsEnum } from '@src/security-group/security-group-permissions';
import { NOT_EXISTED_UUID } from '../constants';
import { DELETE_FAQ_BOARD } from '../graphql/faq';
import { post } from '../request';
import { generateFaqData } from './generate-faq-data';
import { rollbackDbForFaqs } from './rollback-for-faq';

describe('Delete faq board suite case', () => {
  afterEach(async () => {
    await rollbackDbForFaqs();
  });
  it('return_error_if_not_authenticated', async () => {
    const res = await post(DELETE_FAQ_BOARD, { faqId: NOT_EXISTED_UUID });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.UPDATE_FAQS] }
    });
    const res = await post(
      DELETE_FAQ_BOARD,
      { faqId: NOT_EXISTED_UUID },
      admin.token
    );
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_faq_not_exist', async () => {
    const { admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.DELETE_FAQS] }
    });
    const res = await post(
      DELETE_FAQ_BOARD,
      { faqId: NOT_EXISTED_UUID },
      admin.token
    );
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.FAQ_DOES_NOT_EXIST);
  });

  it('delete_faq_board', async () => {
    const { faq, admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.DELETE_FAQS] }
    });
    const res = await post(DELETE_FAQ_BOARD, { faqId: faq.id }, admin.token);
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data).toBe(true);
  });
});
