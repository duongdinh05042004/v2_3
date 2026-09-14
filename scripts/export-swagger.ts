import { writeFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

async function exportSwagger(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('TikTok Lead Generation × Bitrix24 CRM')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('docs/swagger.json', JSON.stringify(document, null, 2));
  await app.close();
}

void exportSwagger();
