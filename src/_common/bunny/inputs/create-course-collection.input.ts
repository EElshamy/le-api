import { Field, InputType } from '@nestjs/graphql';
import { UploadedVideoLibrary } from '../bunny.type';

@InputType()
export class CreateCourseCollectionInput {
  @Field(() => UploadedVideoLibrary)
  type: UploadedVideoLibrary;

  @Field({ nullable: true })
  collectionName?: string;
}
@InputType()
export class deleteCourseCollectionInput {
  @Field(() => String)
  collectionId: string;

  @Field(() => UploadedVideoLibrary)
  type: UploadedVideoLibrary;
}
@InputType()
export class deleteVidOrMoreByIds {
  @Field(() => [String])
  ids: string[];

  @Field(() => UploadedVideoLibrary)
  type: UploadedVideoLibrary;
}
