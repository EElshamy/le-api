import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '@src/auth/auth-user.decorator';
import { User } from '@src/user/models/user.model';
import { AuthGuard } from '../../auth/auth.guard';
import { HasRole } from '../../auth/auth.metadata';
import { UserRoleEnum } from '../../user/user.enum';
import {
  GqlBooleanResponse,
  GqlStringResponse
} from '../graphql/graphql-response.type';
import { BunnyService } from './bunny-service';
import {
  GqlBunnyUploadCredentialsResponse,
  GqlBunnyVideoResponse
} from './bunny.response';
import {
  CreateCourseCollectionInput,
  deleteCourseCollectionInput,
  deleteVidOrMoreByIds
} from './inputs/create-course-collection.input';
import { GetBunnyUploadCredentials } from './inputs/get-upload-credentials.input';
import { GetBunnyViewVideoSignature } from './inputs/get-view-video-credentials.input';
import { UploadedVideoLibrary } from './bunny.type';

@Resolver(() => {})
export class BunnyResolver {
  constructor(private readonly bunnyService: BunnyService) {}

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(() => GqlBunnyUploadCredentialsResponse)
  async getBunnyUploadCredentials(
    @Args('input') input: GetBunnyUploadCredentials,
    @CurrentUser('id') currentUserId: string
  ) {
    return await this.bunnyService.createVideo(input, currentUserId);
  }

  // @UseGuards(VideoGuard)
  // @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(() => GqlBunnyVideoResponse)
  getBunnyViewVideoCredentials(
    @Args('input') input: GetBunnyViewVideoSignature
  ) {
    return this.bunnyService.getViewVideoCredentials(input);
  }

  // @UseGuards(AuthGuard)
  // @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Mutation(() => GqlStringResponse)
  createCourseCollection(
    @Args('input') input: CreateCourseCollectionInput,
    @CurrentUser() currentUser: User
  ) {
    return this.bunnyService.createCourseCollection(
      input.type,
      currentUser,
      input.collectionName
    );
  }

  // @Mutation(() => GqlStringResponse)
  // deleteCourseCollection(@Args('input') input: deleteCourseCollectionInput) {
  //   return this.bunnyService.deleteCollection(input.collectionId, input.type);
  // }

  // @Mutation(() => GqlStringResponse)
  // deleteVideoOrMoreByIds(@Args('input') input: deleteVidOrMoreByIds) {
  //   return this.bunnyService.deleteVideos(input.ids, input.type);
  // }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @Mutation(() => GqlBooleanResponse)
  async reEncodeAllBunnyVideos(
    @Args('libraryType', { type: () => UploadedVideoLibrary })
    libraryType: UploadedVideoLibrary
  ): Promise<boolean> {
    return this.bunnyService.reEncodeAllBunnyVideos(libraryType);
  }
}
