import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { FaqPermissionsEnum } from '@src/security-group/security-group-permissions';
import { FAQS_BOARD } from '../graphql/faq';
import { post } from '../request';
import { generateFaqData } from './generate-faq-data';
import { rollbackDbForFaqs } from './rollback-for-faq';

describe('Faqs board suite case', () => {
  afterEach(async () => {
    await rollbackDbForFaqs();
  });

  it('return_error_if_not_authenticated', async () => {
    const res = await post(FAQS_BOARD);
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { admin } = await generateFaqData();
    const res = await post(FAQS_BOARD, {}, admin.token);
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('faqs_board', async () => {
    const { faq, admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.READ_FAQS] }
    });
    const res = await post(FAQS_BOARD, {}, admin.token);
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.items.length).toBe(1);
    expect(res.body.data.response.data.items[0].arQuestion).toBe(
      faq.arQuestion
    );
  });

  it('faqs_board_is_active_filter', async () => {
    const { faq, admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.READ_FAQS] },
      overrideFaq: { isActive: false }
    });
    const res = await post(
      FAQS_BOARD,
      { filter: { isActive: false } },
      admin.token
    );
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.items.length).toBe(1);
    expect(res.body.data.response.data.items[0].arQuestion).toBe(
      faq.arQuestion
    );
  });

  it('faqs_board_search_key_filter', async () => {
    const { faq, admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.READ_FAQS] },
      overrideFaq: { enQuestion: 'about us' }
    });
    const res = await post(
      FAQS_BOARD,
      { filter: { searchKey: 'us' } },
      admin.token
    );
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.items.length).toBe(1);
    expect(res.body.data.response.data.items[0].enQuestion).toBe(
      faq.enQuestion
    );
  });
});
