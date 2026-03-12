import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { IRepository } from '@src/_common/database/repository.interface';
import { PolicyEnum } from '../enums/policy.enum';
import { UpdatePolicyInput } from '../inputs/update-policy.input';
import { Policy } from '../models/policy.model';

@Injectable()
export class PolicyService {
  constructor(
    @Inject(Repositories.PolicyRepository)
    private readonly policyRepo: IRepository<Policy>
  ) {}

  async getPolicies() {
    return this.policyRepo.findAll();
  }

  async createDefaultPolicies() {
    const existingPolicies = await this.policyRepo.findAll();
    if (existingPolicies.length > 0) return;

    const policies = [
      {
        title: PolicyEnum.PRIVACY_POLICY,
        contentEn: 'Privacy Policy',
        contentAr: 'سياسة الخصوصية'
      },
      {
        title: PolicyEnum.TERMS_AND_CONDITIONS,
        contentEn: 'Terms and Conditions',
        contentAr: 'الشروط والأحكام'
      },
      {
        title: PolicyEnum.PAYMENT_POLICY,
        contentEn: 'Payment Policy',
        contentAr: 'سياسة الدفع'
      }
    ];

    for (const policy of policies) {
      await this.policyRepo.createOne(policy);
    }
  }

  async updatePolicy(input: UpdatePolicyInput) {
    const { title, contentEn, contentAr } = input;
    return this.policyRepo.updateOne({ title }, { contentEn, contentAr });
  }
}
