import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { FaqPermissionsEnum } from '@src/security-group/security-group-permissions';
import { NOT_EXISTED_UUID } from '../constants';
import { UPDATE_FAQ_BOARD } from '../graphql/faq';
import { post } from '../request';
import { generateFaqData } from './generate-faq-data';
import { rollbackDbForFaqs } from './rollback-for-faq';

describe('Update faq board suite case', () => {
  afterEach(async () => {
    await rollbackDbForFaqs();
  });
  it('return_error_if_not_authenticated', async () => {
    const { faq } = await generateFaqData();
    const res = await post(UPDATE_FAQ_BOARD, {
      input: { faqId: faq.id, isActive: true }
    });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { faq, admin } = await generateFaqData();
    const res = await post(
      UPDATE_FAQ_BOARD,
      { input: { faqId: faq.id, isActive: true } },
      admin.token
    );
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_faq_not_exist', async () => {
    const { admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.UPDATE_FAQS] }
    });
    const res = await post(
      UPDATE_FAQ_BOARD,
      { input: { faqId: NOT_EXISTED_UUID, isActive: true } },
      admin.token
    );
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.FAQ_DOES_NOT_EXIST);
  });

  it('update_faq_board', async () => {
    const { faq, admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.UPDATE_FAQS] }
    });
    const res = await post(
      UPDATE_FAQ_BOARD,
      {
        input: {
          faqId: faq.id,
          isActive: false,
          enAnswer: 'enAnswer',
          arAnswer: 'arAnswer'
        }
      },
      admin.token
    );
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.enQuestion).toBe(faq.enQuestion);
    expect(res.body.data.response.data.arQuestion).toBe(faq.arQuestion);
    expect(res.body.data.response.data.enAnswer).toBe('enAnswer');
    expect(res.body.data.response.data.arAnswer).toBe('arAnswer');
    expect(res.body.data.response.data.isActive).toBe(false);
  });
});
