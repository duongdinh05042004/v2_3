import { Module } from '@nestjs/common';
import { FieldMapperService } from './field-mapper.service';

@Module({
  providers: [FieldMapperService],
  exports: [FieldMapperService],
})
export class MappingModule {}
