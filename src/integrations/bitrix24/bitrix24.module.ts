import { Module } from '@nestjs/common';
import { Bitrix24Client } from './bitrix24.client';

@Module({
  providers: [Bitrix24Client],
  exports: [Bitrix24Client],
})
export class Bitrix24Module {}
