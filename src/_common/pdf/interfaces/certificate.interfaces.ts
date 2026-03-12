import { UpperCaseLearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import { CertificateLang } from '../enums/pdf-resource.enum';
import { CertificationType } from '@src/certification/certifications.type';

export interface Certificate {
  fullName: string;
  lecturerName: string;
  providerName: string;
  courseTitle: string;
  courseDuration: string;
  certificateDate: string;
  certificateNumber: string;
  certificateUrl: string;
  aceApprovedCourseNumber?: string,
  aceCecsAwarded?: Number
}

export interface CertificateInput {
  certificateData: Certificate;
  lang: CertificateLang;
  learningProgramType: UpperCaseLearningProgramTypeEnum;
  learningProgramId : string,
  userId: string,
  userCode: string,
  certificationId?: string
  certificationType?: CertificationType,
  isCertified?: boolean,
  aceApprovedCourseNumber?: string,
  aceCecsAwarded?: Number
  isLive ?: boolean
}
