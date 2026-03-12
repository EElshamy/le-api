import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignUsersToDiplomaInput {
  @Field(() => String)
  diplomaId: string;
  @Field(() => [String])
  usersIds: string[];
}

@InputType()
export class AssignUserToDiplomaInput {
  @Field(() => String)
  diplomaId: string;
  @Field(() => String)
  userId: string;
}
