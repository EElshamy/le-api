import { FAQS } from '../graphql/faq';
import { post } from '../request';
import { rollbackDbForFaqs } from './rollback-for-faq';
import { generateFaqData } from './generate-faq-data';

describe('Faqs suite case', () => {
  afterEach(async () => {
    await rollbackDbForFaqs();
  });

  it('faqs', async () => {
    const { faq } = await generateFaqData();
    const res = await post(FAQS, {});

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.items.length).toBe(1);
    expect(res.body.data.response.data.items[0].arQuestion).toBe(faq.arQuestion);
  });

  it('faqs_search_key_filter', async () => {
    const { faq } = await generateFaqData({
      overrideFaq: { enQuestion: 'about us' }
    });
    const res = await post(FAQS, { filter: { searchKey: 'about' } });
    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.items.length).toBe(1);
    expect(res.body.data.response.data.items[0].enQuestion).toBe(faq.enQuestion);
  });
});
