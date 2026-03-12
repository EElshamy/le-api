import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Course } from '@src/course/models/course.model';

@ObjectType()
export class DiplomaLearningProgram extends Course {
    @Field(() => Date ,{ nullable: true })
    addedAt: Date;
}
