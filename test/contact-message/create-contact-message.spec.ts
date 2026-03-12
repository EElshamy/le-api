import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { ContactMessageFactory } from '@src/contact-message/contact-message.factory';
import { ContactMessage } from '@src/contact-message/contact-message.model';
import { CREATE_CONTACT_MESSAGE } from '../graphql/contact-message';
import { post } from '../request';

const contactMessageRepo = new (buildRepository(
  ContactMessage
))() as IRepository<ContactMessage>;

describe('Create contact message suite', () => {
  afterEach(async () => {
    await contactMessageRepo.rawDelete();
  });

  it('create_contact_message', async () => {
    const input = await ContactMessageFactory(true);
    const res = await post(CREATE_CONTACT_MESSAGE, { input });

    expect(res.body.data.response.code).toBe(200);
    expect(res.body.data.response.data.name).toBe(input.name);
    expect(res.body.data.response.data.email).toBe(input.email);
    expect(res.body.data.response.data.phone).toBe(input.phone);
    expect(res.body.data.response.data.contactReason).toBe(input.contactReason);
  });
});
