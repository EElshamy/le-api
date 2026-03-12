import { Module } from '@nestjs/common';
import { VdocipherResolver } from './vdocipher.resolver';
import { VdocipherService } from './vdocipher.service';

@Module({ providers: [VdocipherResolver, VdocipherService], exports: [VdocipherService] })
export class VdocipherModule {}
