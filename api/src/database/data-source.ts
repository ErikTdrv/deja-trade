// Entrypoint for the TypeORM CLI only (`pnpm migration:*`). The app uses DatabaseModule.
import { DataSource } from 'typeorm';
import { loadEnvFiles, validateEnv } from '../config/env';
import { buildDataSourceOptions } from './data-source-options';

loadEnvFiles();

export default new DataSource(buildDataSourceOptions(validateEnv(process.env)));
