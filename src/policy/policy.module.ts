import { Module } from '@nestjs/common';
import { PolicyResolver } from './resolvers/policy.resolver';
import { PolicyService } from './services/policy.service';

@Module({
  providers: [PolicyService, PolicyResolver],
  exports: [PolicyService]
})
export class PolicyModule {}
