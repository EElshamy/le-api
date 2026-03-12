import { faker } from '@faker-js/faker';

export const NOT_EXISTED_UUID = faker.string.uuid();

export const PHONE = '+201099988877';

export const OTHER_PHONE = '+201099955511';

export const NOT_VALID_PHONE = '+2055511';

export const VERIFICATION_CODE = '1234';

export const OTHER_VERIFICATION_CODE = '5678';

export const VALID_PASSWORD = 'm@1234567';

export const OTHER_VALID_PASSWORD = 'm@1234567980';

export const INVALID_PASSWORD = '1234567';

export const OTHER_PASSWORD = 'x123456789';

export const EMAIL = 'email@em.com';

export const OTHER_EMAIL = 'second-email@email.com';

export const INVALID_EMAIL = 'no.com';

export const PAST_TIME = new Date().getTime() - 3600;

export const SUPER_ADMIN_GROUP = 'SuperAdmin';
