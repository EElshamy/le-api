import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { Faq } from './models/faq.model';

const faqRepo = new (buildRepository(Faq))() as IRepository<Faq>;

export type FaqType = {
  enQuestion: string;
  arQuestion: string;
  enAnswer: string;
  arAnswer: string;
  isPublished: boolean;
};

function buildParams(input = <any>{}, returnInputOnly: boolean): FaqType {
  return {
    enQuestion: input.enQuestion || faker.random.words(),
    arQuestion: input.arQuestion || faker.random.words(),
    enAnswer: input.enAnswer || faker.random.words(),
    arAnswer: input.arAnswer || faker.random.words(),
    ...(!returnInputOnly && {
      isPublished:
        input.isActive !== undefined ? input.isActive : faker.datatype.boolean()
    })
  };
}

export const FaqFactory = async (
  returnInputOnly: boolean = false,
  input = <any>{}
): Promise<Faq | FaqType> => {
  const params = buildParams(input, returnInputOnly);
  if (returnInputOnly) return params;
  return await faqRepo.createOne(params);
};

export const FaqsFactory = async (
  count: number = 10,
  input = <any>{}
): Promise<FaqType[]> => {
  let faqs = [];
  for (let i = 0; i < count; i++) faqs.push(buildParams(input, false));
  return await faqRepo.bulkCreate(faqs);
};
