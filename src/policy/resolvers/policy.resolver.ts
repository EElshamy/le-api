import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { HasPermission, HasRole } from '@src/auth/auth.metadata';
import { UserRoleEnum } from '@src/user/user.enum';
import { UpdatePolicyInput } from '../inputs/update-policy.input';
import { Policy } from '../models/policy.model';
import {
  GqlPoliciesNotPaginatedResponse,
  GqlPolicyResponse
} from '../response/policy.response';
import { PolicyService } from '../services/policy.service';
import { LegalContentPermissionsEnum } from '@src/security-group/security-group-permissions';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';

@Resolver(() => Policy)
export class PolicyResolver {
  constructor(private readonly policyService: PolicyService) {}

  @Query(() => GqlPoliciesNotPaginatedResponse)
  async getPolicies() {
    return await this.policyService.getPolicies();
  }

  @UseGuards(AuthGuard)
  @HasRole(UserRoleEnum.ADMIN)
  @HasPermission(LegalContentPermissionsEnum.UPDATE_LEGAL_CONTENTS)
  @Mutation(() => GqlPolicyResponse)
  async updatePolicy(@Args('input') input: UpdatePolicyInput) {
    return await this.policyService.updatePolicy(input);
  }
}
