import { Module } from '@nestjs/common';
import { SkillResolver } from './skill.resolver';
import { SkillService } from './skill.service';
import { SkillDataloader } from './skill.dataloader';

@Module({
  providers: [SkillService, SkillResolver, SkillDataloader],
  exports: [SkillService, SkillDataloader]
})
export class SkillModule {}
