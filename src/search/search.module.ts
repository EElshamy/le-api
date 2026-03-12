import { Module } from '@nestjs/common';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';

@Module({
  imports: [],
  providers: [SearchService, SearchResolver],
  exports: []
})
export class SearchModule {}
