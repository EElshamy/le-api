import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { ReporterTypeEnum } from '@src/report/enums/reporter-type.enum';
import { IsEnum, IsOptional } from 'class-validator';
import { ContactReasonEnum } from '../enums/contact-message.enum';

@InputType()
export class ContactMessageFilter {
  @IsOptional()
  @Field({ nullable: true })
  searchKey?: string;

  @IsOptional()
  @Field({ nullable: true })
  isResolved?: boolean;

  @IsOptional()
  @IsEnum(ContactReasonEnum)
  @Field(type => ContactReasonEnum, { nullable: true })
  contactReason?: ContactReasonEnum;

  @IsOptional()
  @IsEnum(ReporterTypeEnum)
  @Field(type => ReporterTypeEnum, { nullable: true })
  senderType?: ReporterTypeEnum;
}

@ArgsType()
export class ContactMessageFilterInput {
  @IsOptional()
  @Field({ nullable: true })
  filter?: ContactMessageFilter;
}
