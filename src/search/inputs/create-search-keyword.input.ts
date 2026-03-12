import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
  MinLength
} from 'class-validator';

@InputType()
export class CreateSearchKeywordInput {
  @Field()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value
  )
  @IsNotEmpty({ message: 'Arabic text is required.' })
  @MinLength(3, { message: 'Arabic text must be at least 3 characters long.' })
  @MaxLength(100, {
    message: 'Arabic text must be at most 100 characters long.'
  })
  @Matches(/^[\u0600-\u06FF]+(?:\s[\u0600-\u06FF]+)*$/, {
    message:
      'Arabic text must contain Arabic letters only with single spaces between words.'
  })
  arText: string;

  @Field()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value
  )
  @IsNotEmpty({ message: 'English text is required.' })
  @MinLength(3, { message: 'English text must be at least 3 characters long.' })
  @MaxLength(100, {
    message: 'English text must be at most 100 characters long.'
  })
  @Matches(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/, {
    message:
      'English text must contain English letters only with single spaces between words.'
  })
  enText: string;
}
