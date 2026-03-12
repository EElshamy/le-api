import { Module } from '@nestjs/common';
import { HelperModule } from '@src/_common/utils/helper.module';
import { SecurityGroupResolver } from './security-group.resolver';
import { SecurityGroupService } from './security-group.service';

@Module({
  imports: [HelperModule],
  providers: [SecurityGroupResolver, SecurityGroupService],
  exports: [SecurityGroupService]
})
export class SecurityGroupModule {}
