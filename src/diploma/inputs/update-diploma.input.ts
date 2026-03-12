import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateDiplomaInput } from './create-diploma.input';
import { UpdateActions } from '../enums/update-reasons.enum';
import { IsNotEmpty, isNotEmpty } from 'class-validator';
import { IsNotBlank } from '@src/_common/custom-validator/not-bank.validator';

@InputType()
export class  UpdateDiplomaInput extends PartialType(CreateDiplomaInput) {
  @Field(() => String)
  diplomaId: string;

  @Field(() => [UpdateActions], { nullable: true })
  updateActions?: UpdateActions[];
}
