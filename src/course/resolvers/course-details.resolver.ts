import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { LangEnum } from '@src/user/user.enum';
import { CourseDetail } from '../models/course-detail.model';

@Resolver(() => CourseDetail)
export class CourseDetailsResolver {
  @ResolveField(() => String, { nullable: true })
  summary(
    @Parent() courseDetail: CourseDetail,
    @Context('lang') lang: LangEnum
  ) {
    return (
      courseDetail[`${lang.toLowerCase()}Summary`] ?? courseDetail.arSummary
    );
  }

  @ResolveField(() => String, { nullable: true })
  about(@Parent() courseDetail: CourseDetail, @Context('lang') lang: LangEnum) {
    return courseDetail[`${lang.toLowerCase()}About`] ?? courseDetail.arAbout;
  }
}
