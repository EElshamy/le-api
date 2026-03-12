import { registerEnumType } from '@nestjs/graphql';
import { FILE } from 'dns';
import { register } from 'module';
import { TEXT } from 'sequelize';

export enum QuizRelatedTypeEnum {
  SECTION = 'SECTION',
  LESSON = 'LESSON',
  COURSE = 'COURSE',
  DIPLOMA = 'DIPLOMA'
}

export enum QuizDurationEnum {
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  SECONDS = 'SECONDS'
}

export enum QuestionTypeEnum {
  MCQ = 'MCQ',
  TEXT = 'TEXT',
  FILE = 'FILE'
}

registerEnumType(QuizRelatedTypeEnum, { name: 'QuizRelatedTypeEnum' });
registerEnumType(QuizDurationEnum, { name: 'QuizDurationEnum' });
registerEnumType(QuestionTypeEnum, { name: 'QuestionTypeEnum' });
