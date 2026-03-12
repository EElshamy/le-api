import { faker } from '@faker-js/faker';
import { buildRepository } from '@src/_common/database/database-repository.builder';
import { IRepository } from '@src/_common/database/repository.interface';
import { FieldOfTrainingsFactory } from '../../field-of-training/field-of-training.factory';
import { JobTitleFactory } from '../../job-title/job-title.factory';
import {
  ApprovalStatusEnum,
  PreferredPaymentMethodEnum
} from '../enums/lecturer.enum';
import { Lecturer } from '../models/lecturer.model';

const lecturerRepo = new (buildRepository(Lecturer))() as IRepository<Lecturer>;

async function buildParams(input = <any>{}): Promise<Partial<Lecturer>> {
  const jobTitle = await JobTitleFactory();
  const fieldsOfTrainings = await FieldOfTrainingsFactory(2);

  return {
    status: ApprovalStatusEnum.APPROVED,
    jobTitleId: jobTitle.id,
    yearsOfExperience: Math.floor(Math.random() * 51),
    linkedInUrl: 'https://www.linkedin.com/in/mark-zuckerberg-618bba58',
    instagramUrl: 'https://www.instagram.com/zuck/',
    facebookUrl: 'https://www.facebook.com/zuck/',
    cvUrl: faker.internet.url().replace('https', ''),
    preferredPaymentMethod: faker.helpers.arrayElement(
      Object.keys(PreferredPaymentMethodEnum)
    ),
    bankIBAN: faker.finance.iban(),
    vodafoneCashNumber: faker.helpers.fromRegExp('+2010[0-9]{8}'),
    bankAccountNumber: String(Math.floor(Math.random() * 10000000000)),
    enBio: faker.lorem.sentence(),
    arBio: faker.lorem.sentence(),
    commissionPercentage: Math.floor(Math.random() * 101),
    uploadedMaterialUrl: faker.internet.url(),
    fieldOfTrainings: fieldsOfTrainings,
    ...input,
    userId: input.userId
  };
}

export const LecturerFactory = async (
  input = <any>{},
  returnInputOnly: boolean = false
): Promise<Partial<Lecturer>> => {
  const params = await buildParams(input);
  if (returnInputOnly) return params;
  const lecturer = await lecturerRepo.createOne(params);
  if (params.fieldOfTrainings?.length)
    await lecturer.$set('fieldOfTrainings', params.fieldOfTrainings);
  return lecturer;
};
