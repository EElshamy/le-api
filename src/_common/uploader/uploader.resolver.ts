import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  GqlBooleanResponse,
  GqlStringResponse
} from '../graphql/graphql-response.type';
import { FileToMakePublic, UploadFileInput } from './upload-file.input';
import { UploaderService } from './uploader.service';
// import { AuthGuard } from '@src/auth/auth.guard';
// import { UseGuards } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';
import { CurrentUser } from '../../auth/auth-user.decorator';
import { GenerateUploadPreSignedUrlInput } from '../aws/s3/get-signed-url.input';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
@Resolver()
export class UploaderResolver {
  constructor(private readonly uploadService: UploaderService) {}

  // @UseGuards(AuthGuard) // Auth for upload (issue: STOP IT BECAUSE OF REGISTRATION)
  @Mutation(() => GqlStringResponse)
  async uploadFile(
    @Args() input: UploadFileInput,
    @CurrentUser('id') currentUserId: string
  ) {
    throw new BaseHttpException(ErrorCodeEnum.ACCESS_DENIED);
    return await this.uploadService.graphqlUpload(
      { file: input.file, saveTo: input.model },
      currentUserId
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlStringResponse)
  async generateUploadLink(
    @Args('input') input: GenerateUploadPreSignedUrlInput,
    @CurrentUser('id') currentUserId: string
  ) {
    return await this.uploadService.generateUploadUrl(input, currentUserId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => GqlStringResponse)
  async generatePresignedViewUrl(
    @Args('filePath') filePath: string
  ): Promise<string> {
    return await this.uploadService.generatePresignedViewUrlForViewOrDownload(
      filePath
    );
  }

  /**
   *used only in digital ocean spaces, 
   *because its the only way to make files public in digital ocean
   */
  @Mutation(() => GqlBooleanResponse)
  async makeFilesPublicAfterUpload(
    @Args('input', { type: () => [FileToMakePublic] }) input: FileToMakePublic[]
  ): Promise<boolean> {
    return this.uploadService.makeFilesPublic(input);
  }
}
