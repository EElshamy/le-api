import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateAppConfigurationInput {
  @IsNotEmpty()
  @IsString()
  @Field()
  key: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  value: string;

  @IsNotEmpty()
  @IsString()
  @Field()
  displayAs: string;
}
