import { Field, InputType, Int } from '@nestjs/graphql';
import { ValidFilePath } from '@src/_common/custom-validator/valid-file-path';
import { TextValidation } from '@src/_common/decorators/textValidation.decorator';
import { LangEnum } from '@src/user/user.enum';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MaxLength,
  MinLength
} from 'class-validator';

@InputType()
export class CreateBlogInput {
  @ValidFilePath({ message: 'file should not contain domain' })
  @Field()
  thumbnail: string;

  @Field()
  @TextValidation({ minLength: 2, maxLength: 150, allowArabic: true })
  @IsNotEmpty()
  arTitle: string;

  @Field()
  @TextValidation({ minLength: 2, maxLength: 150, allowArabic: false })
  @IsNotEmpty()
  enTitle: string;

  @Field()
  // @TextValidation({ minLength: 20, maxLength: 20000, allowArabic: true })
  @MinLength(20)
  @MaxLength(100000)
  @IsNotEmpty()
  arContent: string;

  @Field()
  // @TextValidation({ minLength: 20, maxLength: 20000, allowArabic: false })
  @MinLength(20)
  @MaxLength(100000)
  @IsNotEmpty()
  enContent: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(20)
  @MaxLength(20000)
  altText: string;

  @IsPositive()
  @Field(() => Int)
  categoryId: number;

  @Field({ nullable: true })
  lecturerId: string;

  @Field(() => LangEnum, { nullable: true })
  @IsOptional()
  lang?: LangEnum;

  @IsPositive({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Field(() => [Int])
  tagsIds: number[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  @ValidFilePath({ each: true, message: 'File path cannot contain the domain' })
  contentImagesUrls: string[];
}
