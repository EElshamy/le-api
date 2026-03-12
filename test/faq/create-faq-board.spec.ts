import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { FaqPermissionsEnum } from '@src/security-group/security-group-permissions';
import { CREATE_FAQ_BOARD } from '../graphql/faq';
import { post } from '../request';
import { generateFaqData } from './generate-faq-data';
import { rollbackDbForFaqs } from './rollback-for-faq';

describe('Create faq board suite case', () => {
  afterEach(async () => {
    await rollbackDbForFaqs();
  });

  it('return_error_if_not_authenticated', async () => {
    const { input } = await generateFaqData();
    const res = await post(CREATE_FAQ_BOARD, { input });
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('return_error_if_wrong_permission', async () => {
    const { input, admin } = await generateFaqData({
      overrideSecurityGroup: { permissions: [FaqPermissionsEnum.UPDATE_FAQS] }
    });
    const res = await post(CREATE_FAQ_BOARD, { input }, admin.token);
    expect(res.body.data.response.code).toBe(ErrorCodeEnum.UNAUTHORIZED);
  });

  it('create_faq_board', async () => {
    const { input, admin } = await generateFaqData();
    const res = await post(CREATE_FAQ_BOARD, { input }, admin.token);
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.enQuestion).toBe(input.enQuestion);
    expect(res.body.data.response.data.arQuestion).toBe(input.arQuestion);
    expect(res.body.data.response.data.enAnswer).toBe(input.enAnswer);
    expect(res.body.data.response.data.arAnswer).toBe(input.arAnswer);
  });
});
