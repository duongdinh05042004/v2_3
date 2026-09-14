import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';

loadEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'tiktok',
  password: process.env.DB_PASSWORD ?? 'tiktok_secret',
  database: process.env.DB_NAME ?? 'tiktok_bitrix24',
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
