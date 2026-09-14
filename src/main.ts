import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  app.useLogger(app.get(Logger));
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const apiPrefix = config.get<string>('apiPrefix') ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'health/live', 'health/ready', 'webhooks/tiktok/leads', 'webhooks/bitrix24/deals'],
  });

  const swagger = new DocumentBuilder()
    .setTitle('TikTok Lead Generation × Bitrix24 CRM')
    .setDescription(
      'Automation platform that ingests TikTok Lead Generation webhooks, normalizes and deduplicates leads, syncs them to Bitrix24, converts qualified leads into deals, and exposes analytics APIs.',
    )
    .setVersion('1.0.0')
    .addTag('webhooks')
    .addTag('leads')
    .addTag('deals')
    .addTag('config')
    .addTag('analytics')
    .addTag('reports')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/swagger.json',
  });

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
