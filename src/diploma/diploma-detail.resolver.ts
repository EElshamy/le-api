import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { DiplomaDetail } from './models/diploma-detail.model';
import { LangEnum } from '@src/user/user.enum';

@Resolver(() => DiplomaDetail)
export class DiplomaDetailResolver {
  @ResolveField(() => String)
  summary(
    @Parent() diplomaDetail: DiplomaDetail,
    @Context('lang') lang: LangEnum
  ) {
    return (
      diplomaDetail[`${lang.toLowerCase()}Summary`] ?? diplomaDetail.arSummary
    );
  }

  @ResolveField(() => String)
  about(
    @Parent() diplomaDetail: DiplomaDetail,
    @Context('lang') lang: LangEnum
  ) {
    return diplomaDetail[`${lang.toLowerCase()}About`] ?? diplomaDetail.arAbout;
  }
}
