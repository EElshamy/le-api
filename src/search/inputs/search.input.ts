import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { GeneralSearchFilter } from '../interfaces/inputs.interfaces';

@ArgsType()
export class GeneralSearchFilterInput {
  @IsOptional()
  @Field({ nullable: true })
  filter: GeneralSearchFilter;
}
