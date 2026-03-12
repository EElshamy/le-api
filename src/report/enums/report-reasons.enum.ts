import { registerEnumType } from '@nestjs/graphql';

export enum ReportReasonEnum {
  MISINFORMATION = 'Misinformation',
  HARASSMENT = 'Harassment',
  SPAM = 'Spam',
  OFF_TOPIC = 'Off-topic',
  PRIVACY_VIOLATION = 'Privacy-Violation',
  FALSE_CLAIMS = 'False-Claims',
  INAPPROPRIATE_CONTENT = 'Inappropriate-Content'
}

registerEnumType(ReportReasonEnum, {
  name: 'ReportReasonEnum'
});
