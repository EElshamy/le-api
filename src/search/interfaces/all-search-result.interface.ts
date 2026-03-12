import { Field, ObjectType } from '@nestjs/graphql';
import { Blog } from '@src/blogs/blog/models/blog.model';
import { Course } from '@src/course/models/course.model';
import { Diploma } from '@src/diploma/models/diploma.model';

@ObjectType()
export class AllSearchResult {
  @Field(() => [Course])
  courses: Course[];

  @Field(() => [Course])
  workshops: Course[];

  @Field(() => [Diploma])
  diplomas: Diploma[];

  @Field(() => [Blog])
  blogs: Blog[];
}
