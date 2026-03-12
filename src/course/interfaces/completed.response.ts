import { Field, ObjectType } from '@nestjs/graphql';
import { Diploma } from '@src/diploma/models/diploma.model';
import { Course } from '../models/course.model';

@ObjectType()
export class CompletedResponse {
  @Field(() => Diploma, { nullable: true })
  diploma: Diploma;

  @Field(() => [Course])
  completedCourses: Course[];
}

@ObjectType()
export class CertifiedResponse {
  @Field(() => Diploma, { nullable: true })
  diploma: Diploma;

  @Field(() => [Course])
  certifiedCourses: Course[];
}

