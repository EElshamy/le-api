import { Module } from '@nestjs/common';
import { FieldOfTrainingService } from './field-of-training.service';
import { FieldOfTrainingResolver } from './field-of-training.resolver';

@Module({
  providers: [FieldOfTrainingService, FieldOfTrainingResolver],
  exports: [FieldOfTrainingService]
})
export class FieldOfTrainingModule {}
