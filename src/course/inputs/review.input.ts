import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { LearningProgramTypeEnum } from '@src/cart/enums/cart.enums';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';

@InputType()
export class AddReviewInput {
  @Field(() => Int)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @Field()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  review: string;

  @Field()
  @IsNotEmpty()
  learningProgramId: string;

  @Field(() => LearningProgramTypeEnum)
  learningProgramType: LearningProgramTypeEnum;
}

@InputType()
export class ReviewsFiterInput {
  @Field({ nullable: true })
  learningProgramId?: string;
  //* type..
  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  rating?: number;
}

@ArgsType()
export class ReviewsFilter {
  @Field(() => ReviewsFiterInput, { nullable: true })
  @IsOptional()
  filter?: ReviewsFiterInput;
}
