import { Module } from '@nestjs/common';
import { BunnyService } from './bunny-service';
import { BunnyResolver } from './bunny.resolver';

@Module({ providers: [BunnyResolver, BunnyService], exports: [BunnyService] })
export class BunnyModule {}
