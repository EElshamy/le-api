import { ContentLevelEnum } from '@src/course/enums/course.enum';
import { CourseLecturer } from '@src/course/models/course-lecturers.model';
import { Lecturer } from '@src/lecturer/models/lecturer.model';

export interface ILearningProgram {
  id: string;
  code: string;
  // lecturerId?: string;
  arTitle: string;
  enTitle: string;
  level: ContentLevelEnum;
  learningTime: number;
  // lecturer?: Lecturer;
  // commissionPercentage?: number;
  courseLecturers?: CourseLecturer[];
  originalPrice: number;
  priceAfterDiscount: number;
  remoteProductId: string;
  thumbnail: string;
}
