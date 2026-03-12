import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from 'sequelize-transactional-typescript';
import { config } from './database.config';
import { repositories } from './database.models';

@Global()
@Module({
  imports: [SequelizeModule.forRoot(config())],
  providers: [...repositories],
  exports: [...repositories]
})
export class DatabaseModule {}
