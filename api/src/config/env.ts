import { existsSync } from 'node:fs';

export interface Env {
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  PORT: number;
}

// api/.env wins over the repo-root .env; real env vars win over both.
export const ENV_FILES = ['.env', '../.env'];

// For entrypoints outside Nest (TypeORM CLI). Nest's ConfigModule does the same via envFilePath.
export function loadEnvFiles(): void {
  for (const file of ENV_FILES) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const errors: string[] = [];

  const str = (key: string): string => {
    const value = raw[key];
    if (typeof value !== 'string' || value === '') {
      errors.push(`${key} is required`);
      return '';
    }
    return value;
  };

  const int = (key: string, fallback?: number): number => {
    const value = raw[key];
    if (value === undefined || value === '') {
      if (fallback !== undefined) return fallback;
      errors.push(`${key} is required`);
      return NaN;
    }
    const n = Number(value);
    if (!Number.isInteger(n)) errors.push(`${key} must be an integer`);
    return n;
  };

  const env: Env = {
    POSTGRES_HOST: str('POSTGRES_HOST'),
    POSTGRES_PORT: int('POSTGRES_PORT', 5432),
    POSTGRES_USER: str('POSTGRES_USER'),
    POSTGRES_PASSWORD: str('POSTGRES_PASSWORD'),
    POSTGRES_DB: str('POSTGRES_DB'),
    PORT: int('PORT', 3000),
  };

  if (errors.length) {
    throw new Error(`Invalid environment:\n  ${errors.join('\n  ')}`);
  }
  return env;
}
