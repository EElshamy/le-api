import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { PublicationStatusEnum } from '@src/course/enums/course.enum';
import { IsOptional } from 'class-validator';

@InputType()
export class lecturerDiplomasFilter {
  @Field({ nullable: true })
  searchKey?: string;

  @Field(() => PublicationStatusEnum, { nullable: true })
  publicationStatus?: PublicationStatusEnum;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  categoryId?: number;
}

@ArgsType()
export class LecturerDiplomasBoardFilter {
  @IsOptional()
  @Field({ nullable: true })
  filter: lecturerDiplomasFilter;
}
