import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { S3Service } from '@src/_common/aws/s3/s3.service';
import { BaseHttpException } from '@src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from '@src/_common/exceptions/error-code.enum';
import { generateGqlResponseType } from '@src/_common/graphql/graphql-response.type';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { AuthGuard } from '@src/auth/auth.guard';
import { SearchSortInput } from '@src/course/inputs/search.types';
import { User } from '@src/user/models/user.model';
import { Certification } from './certification.model';
import { CertificationService } from './certification.service';
import { CertificationFilter } from './inputs/certifications-filter.input';
import { CreateCertificationInput } from './inputs/create-certification.input';
import {
  LearningProgramTypeEnum,
  UpperCaseLearningProgramTypeEnum
} from '@src/cart/enums/cart.enums';
import { LangEnum } from '@src/user/user.enum';
import { GqlSiteMapResponse } from '@src/_common/graphql/site-map.resoponse';
import { DigitalOceanSpacesService } from '@src/_common/digitalocean/services/spaces.service';
import { CertificationType } from './certifications.type';

const GqlCerfificationResponse = generateGqlResponseType(Certification);
const GqlCerfificationsResponse = generateGqlResponseType([Certification]);
@Resolver(type => Certification)
export class CertificationResolver {
  constructor(
    private readonly certificationService: CertificationService,
    // private readonly s3Service: S3Service,
    private readonly digitalOceanService: DigitalOceanSpacesService
  ) {}

  // ********************** Mutations ********************** //

  @UseGuards(AuthGuard)
  @Mutation(() => GqlCerfificationResponse)
  async createCertification(@Args('input') input: CreateCertificationInput) {
    return await this.certificationService.createCertification(input);
  }
  // ********************** Queries ********************** //

  @UseGuards(AuthGuard)
  @Query(() => GqlCerfificationsResponse)
  async certifications(
    @Args('filter', { nullable: true }) filter?: CertificationFilter,
    @Args({ nullable: true }) sort?: SearchSortInput,
    @Args() paginator?: NullablePaginatorInput,
    @CurrentUser() currentUser?: User
  ) {
    return this.certificationService.certifications(
      filter,
      sort,
      paginator,
      currentUser
    );
  }

  @UseGuards(AuthGuard)
  @Query(() => GqlCerfificationsResponse)
  async myCertifications(
    @CurrentUser() currentUser: User,
    @Args() paginator: NullablePaginatorInput
  ) {
    if (!currentUser) {
      throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
    }

    return await this.certificationService.myCertifications(
      currentUser,
      paginator.paginate
    );
  }

  // @UseGuards(AuthGuard)
  @Query(() => GqlCerfificationResponse)
  async certification(
    @Args('certificateId', { type: () => String, nullable: true })
    certificateId?: string,
    @Args('serialNumber', { type: () => String, nullable: true })
    serialNumber?: string
  ) {
    if (!certificateId && !serialNumber) {
      throw new BaseHttpException(ErrorCodeEnum.INVALID_INPUT);
    }

    return await this.certificationService.getCertificateByIdOrSerial(
      certificateId,
      serialNumber
    );
  }

  @Query(() => GqlSiteMapResponse)
  async certificationsForSiteMap() {
    return await this.certificationService.certificationsForSiteMap();
  }

  // ********************** Resolve Fields ********************** //

  @ResolveField(() => String, { nullable: true })
  async programTitle(
    @Parent() certification: Certification,
    @Context('lang') lang: LangEnum
  ) {
    console.log('lang ', lang);

    return (
      (
        await this.certificationService.certificationLearningProgram(
          certification.learningProgramId,
          certification.learningProgramType
        )
      )?.[`${lang.toLowerCase()}Title`] || null
    );
  }

  //--------
  @ResolveField(() => String)
  async downloadArUrl(
    @Parent() certification: Certification,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser || currentUser?.id !== certification.userId) {
      return null;
    }

    const isLeiaqa =
      certification.certificationType === CertificationType.LEIAQA;

    const certificateImagePath =
      isLeiaqa ?
        `certifications/${certification.serialNumber}_${certification.certificationType.toLowerCase()}_ar.pdf`
      : `certifications/${certification.serialNumber}_${certification.certificationType.toLowerCase()}_en.pdf`;

    return await this.digitalOceanService.getPresignedUrlForDownload(
      certificateImagePath
    );
  }

  @ResolveField(() => String)
  async downloadEnUrl(
    @Parent() certification: Certification,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser || currentUser?.id !== certification.userId) {
      return null;
    }

    const certificateEnPath = `certifications/${certification.serialNumber}_${certification.certificationType.toLowerCase()}_en.pdf`;
    return await this.digitalOceanService.getPresignedUrlForDownload(
      certificateEnPath
    );
  }

  @ResolveField(() => String)
  async previewArUrl(@Parent() certification: Certification) {
    const isLeiaqa =
      certification.certificationType === CertificationType.LEIAQA;

    const certificateImagePath =
      isLeiaqa ?
        `certifications/${certification.serialNumber}_${certification.certificationType.toLowerCase()}_ar_preview.png`
      : `certifications/${certification.serialNumber}_${certification.certificationType.toLowerCase()}_en_preview.png`;

    return await this.digitalOceanService.getPresignedUrlForDownload(
      certificateImagePath
    );
  }

  @ResolveField(() => String)
  async previewEnUrl(@Parent() certification: Certification) {
    const certificateImagePath = `certifications/${certification.serialNumber}_${certification.certificationType.toLowerCase()}_en_preview.png`;
    return await this.digitalOceanService.getPresignedUrlForDownload(
      certificateImagePath
    );
  }
  //--------

  @ResolveField(() => Boolean)
  async canDownload(
    @Parent() certification: Certification,
    @CurrentUser() currentUser: User
  ) {
    if (!currentUser) {
      return false;
    }
    return currentUser?.id === certification.userId;
  }

  @ResolveField(() => [Certification], { nullable: true })
  async CoursesCertifications(
    @Parent() certification: Certification,
    @CurrentUser() currentUser: User
  ): Promise<Certification[]> {
    if (
      certification.learningProgramType ===
      UpperCaseLearningProgramTypeEnum.DIPLOMA
    ) {
      return await this.certificationService.diplomaCoursesCertifications(
        certification.learningProgramId,
        currentUser.id
      );
    } else {
      return null;
    }
  }
}
