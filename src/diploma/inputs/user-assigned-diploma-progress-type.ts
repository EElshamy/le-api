import { Field, ObjectType } from "@nestjs/graphql";
import { generateGqlResponseType } from "@src/_common/graphql/graphql-response.type";
import { User } from "@src/user/models/user.model";


@ObjectType()
// export class UserAssignedDiplomaProgressType extends User {
export class UserAssignedDiplomaProgressType extends User {

    @Field(()=>Number , {defaultValue:0})
    completedLessons : Number
    @Field(()=>Number,{defaultValue:0})
    totalLessons:Number
    @Field(()=>Boolean , {defaultValue:false})
    completeDiploma: Boolean
    @Field(()=>Date )
    joinedDiplomaAt : Date
}

export const GqlUsersAssignedDiplomaProgressType = generateGqlResponseType([UserAssignedDiplomaProgressType])