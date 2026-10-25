import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { Env } from '../config/env';

type DbEnv = Pick<
  Env,
  | 'POSTGRES_HOST'
  | 'POSTGRES_PORT'
  | 'POSTGRES_USER'
  | 'POSTGRES_PASSWORD'
  | 'POSTGRES_DB'
>;

// Shared by the Nest app and the TypeORM CLI so both see the same schema.
export function buildDataSourceOptions(env: DbEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    // Schema changes only through migrations (HNSW indexes etc. are hand-written).
    synchronize: false,
    migrationsRun: false,
    // {ts,js}: .ts under ts-node (CLI), .js from dist (app).
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
  };
}
