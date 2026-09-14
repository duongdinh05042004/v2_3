export type AppConfig = {
  nodeEnv: string;
  port: number;
  appName: string;
  apiPrefix: string;
  apiKey: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    synchronize: boolean;
    logging: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  tiktok: {
    appSecret: string;
    accessToken: string;
    pixelCode: string;
    apiBaseUrl: string;
    webhookToleranceSeconds: number;
  };
  bitrix24: {
    webhookUrl: string;
    webhookSecret: string;
    timeoutMs: number;
  };
  queue: {
    prefix: string;
    leadProcessAttempts: number;
    bitrixSyncAttempts: number;
    conversionSyncAttempts: number;
  };
  throttle: {
    ttl: number;
    limit: number;
    webhookLimit: number;
    exportLimit: number;
  };
  cache: {
    ttlSeconds: number;
    mappingTtlSeconds: number;
  };
  notify: {
    webhookUrl?: string;
    emailFrom: string;
  };
  report: {
    cron: string;
    staleLeadHours: number;
  };
  logLevel: string;
};

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  appName: process.env.APP_NAME ?? 'tiktok-bitrix24-integration',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  apiKey: process.env.API_KEY ?? 'change-me-to-a-strong-random-key',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'tiktok',
    password: process.env.DB_PASSWORD ?? 'tiktok_secret',
    name: process.env.DB_NAME ?? 'tiktok_bitrix24',
    synchronize: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
  },
  tiktok: {
    appSecret: process.env.TIKTOK_APP_SECRET ?? 'tiktok_app_secret_change_me',
    accessToken: process.env.TIKTOK_ACCESS_TOKEN ?? 'mock-tiktok-access-token',
    pixelCode: process.env.TIKTOK_PIXEL_CODE ?? 'CXXXXXXXXXXXXXXX',
    apiBaseUrl: process.env.TIKTOK_API_BASE_URL ?? 'http://localhost:4001',
    webhookToleranceSeconds: parseInt(process.env.TIKTOK_WEBHOOK_TOLERANCE_SECONDS ?? '300', 10),
  },
  bitrix24: {
    webhookUrl: process.env.BITRIX24_WEBHOOK_URL ?? 'http://localhost:4002/rest',
    webhookSecret: process.env.BITRIX24_WEBHOOK_SECRET ?? 'bitrix24_webhook_secret_change_me',
    timeoutMs: parseInt(process.env.BITRIX24_TIMEOUT_MS ?? '10000', 10),
  },
  queue: {
    prefix: process.env.QUEUE_PREFIX ?? 'tb24',
    leadProcessAttempts: parseInt(process.env.LEAD_PROCESS_ATTEMPTS ?? '5', 10),
    bitrixSyncAttempts: parseInt(process.env.BITRIX_SYNC_ATTEMPTS ?? '5', 10),
    conversionSyncAttempts: parseInt(process.env.CONVERSION_SYNC_ATTEMPTS ?? '5', 10),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    webhookLimit: parseInt(process.env.WEBHOOK_THROTTLE_LIMIT ?? '300', 10),
    exportLimit: parseInt(process.env.EXPORT_THROTTLE_LIMIT ?? '10', 10),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS ?? '60', 10),
    mappingTtlSeconds: parseInt(process.env.MAPPING_CACHE_TTL_SECONDS ?? '300', 10),
  },
  notify: {
    webhookUrl: process.env.NOTIFY_WEBHOOK_URL || undefined,
    emailFrom: process.env.NOTIFY_EMAIL_FROM ?? 'crm-alerts@example.com',
  },
  report: {
    cron: process.env.REPORT_CRON ?? '0 8 * * *',
    staleLeadHours: parseInt(process.env.ALERT_STALE_LEAD_HOURS ?? '24', 10),
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
});
