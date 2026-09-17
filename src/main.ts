import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocsAuthMiddleware } from './common/middleware/docs-auth.middleware';
import { appValidationPipe } from './common/pipes/app-validation.pipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('nodeEnv') ?? 'development';
  app.useLogger(app.get(Logger));
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  const corsOrigins = config.get<string[]>('cors.origins') ?? [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : nodeEnv === 'production' ? false : true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-actor-id',
      'TikTok-Signature',
      'x-bitrix-secret',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(appValidationPipe);

  const apiPrefix = config.get<string>('apiPrefix') ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'health/live', 'health/ready', 'webhooks/tiktok/leads', 'webhooks/bitrix24/deals'],
  });

  const swaggerEnabled = config.get<boolean>('swaggerEnabled') ?? nodeEnv !== 'production';
  if (swaggerEnabled) {
    const docsAuth = new DocsAuthMiddleware(config);
    app.use((req: Request, res: Response, next: NextFunction) => docsAuth.use(req, res, next));
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
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: 'docs/swagger.json',
    });
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
