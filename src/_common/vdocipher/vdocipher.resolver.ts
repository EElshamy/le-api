import { Args, Resolver, Query } from '@nestjs/graphql';
import { GetVdocipherUploadCredentials } from './inputs/get-upload-credentials.input';
import { VdocipherService } from './vdocipher.service';
import {
  GqlVdocipherPlaybackInfo,
  GqlVdocipherUploadCredentialsResponse
} from './vdocipher.response';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { HasRole } from '../../auth/auth.metadata';
import { UserRoleEnum } from '../../user/user.enum';
import { GetVdocipherOtpForVideoPlayer } from './inputs/get-video-otp.input';

@Resolver(() => {})
export class VdocipherResolver {
  constructor(private readonly vdocipherService: VdocipherService) {}

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(returns => GqlVdocipherUploadCredentialsResponse)
  async getVdocipherUploadCredentials(@Args('input') input: GetVdocipherUploadCredentials) {
    return await this.vdocipherService.getUploadCredentials(input);
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN, UserRoleEnum.LECTURER)
  @Query(returns => GqlVdocipherPlaybackInfo)
  async getVdocipherPlaybackInfo(@Args() input: GetVdocipherOtpForVideoPlayer) {
    return await this.vdocipherService.getVdocipherPlaybackInfo(input.videoId);
  }
}
