import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrades1792917025015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE trades (
                id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                user_id    uuid NOT NULL,
                created_at timestamptz NOT NULL DEFAULT now(),
                journal_trade_id int NOT NULL,
                traded_at timestamptz NOT NULL,
                instrument text NOT NULL,
                direction text NOT NULL CHECK (direction IN ('BUY','SELL')),
                risk_pct numeric NOT NULL,
                planned_rr numeric,
                result_usd numeric NOT NULL,
                result_pct numeric NOT NULL,
                realized_r numeric GENERATED ALWAYS AS (result_pct / NULLIF(risk_pct, 0)) STORED,
                description text NULL,
                UNIQUE(user_id, journal_trade_id)
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE trades`);
  }
}
