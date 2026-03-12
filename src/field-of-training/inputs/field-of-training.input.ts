import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ArgsType()
export class FieldOfTrainingInput {
  @IsUUID('4')
  @Field(type => ID)
  fieldOfTrainingId: string;
}
