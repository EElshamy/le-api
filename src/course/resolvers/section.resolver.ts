import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { S3Service } from '@src/_common/aws/s3/s3.service';
import { IDataLoaders } from '@src/_common/dataloader/dataloader.interface';
import { ResourceTypeEnum } from '../enums/course.enum';
import { CourseInput } from '../inputs/course.input';
import {
  GqlSectionsResponse,
  GqlSectionsWithoutPaginationResponse
} from '../interfaces/course.response';
import { LessonResourcesType } from '../interfaces/course.type';
import { Lesson } from '../models/lesson.model';
import { Section } from '../models/section.model';
import { SectionService } from '../services/section.service';
import { NullablePaginatorInput } from '@src/_common/paginator/paginator.input';
import { LangEnum } from '@src/user/user.enum';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { Inject } from '@nestjs/common';
import { IRepository } from '@src/_common/database/repository.interface';
import { QuizRelatedTypeEnum } from '@src/quiz/enum/quiz.enum';
import { DigitalOceanSpacesService } from '@src/_common/digitalocean/services/spaces.service';

@Resolver(() => Section)
export class SectionResolver {
  constructor(
    private readonly sectionService: SectionService,
    // private readonly s3Service: S3Service
    private readonly digitalOceanService : DigitalOceanSpacesService
  ) {}

  @Query(() => GqlSectionsResponse)
  sectionsAndLessonsByCourseId(
    @Args() { courseId }: CourseInput,
    @Args() pagination: NullablePaginatorInput
  ) {
    return this.sectionService.sectionsAndLessonsByCourseId(
      courseId,
      pagination
    );
  }

  @Query(() => GqlSectionsWithoutPaginationResponse)
  sectionsWithResources(@Args() { courseId }: CourseInput) {
    return this.sectionService.sectionsByCourseId(courseId);
  }

  @ResolveField(() => [Lesson], { nullable: true })
  lessons(
    @Parent() section: Section,
    @Context('loaders') loaders: IDataLoaders
  ) {
    return loaders.sectionLessonsLoader.load(section.id);
  }

  @ResolveField(() => [LessonResourcesType], { nullable: true })
  async resources(@Parent() section: Section): Promise<LessonResourcesType[]> {
    const lessons = await this.sectionService.sectionResources(section.id);

    if (!lessons || !lessons?.length) {
      return [];
    }

    // Flatten the resources and add presigned URLs for attachments
    const allResources = lessons?.flatMap(lesson => lesson);

    if (!allResources.length) {
      return [];
    }

    return Promise.all(
      allResources?.map(async resource => {
        if (resource.type === ResourceTypeEnum.ATTACHMENT) {
          const downloadUrl = await this.digitalOceanService.getPresignedUrlForDownload(
            resource.url
          );
          return { ...resource, downloadUrl };
        }
        return resource;
      })
    );
  }

  @ResolveField(() => String, { nullable: true })
  async title(
    @Parent() section: Section,
    @Context('lang') lang: LangEnum
  ): Promise<string> {
    return section[`${lang.toLowerCase()}Title`] ?? section.enTitle;
  }
}
