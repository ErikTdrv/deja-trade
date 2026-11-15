import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutbox1794688970874 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE outbox (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        event_type text NOT NULL,
        aggregate_id text NOT NULL,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        processed_at timestamptz NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX outbox_unprocessed_idx ON outbox (id) WHERE processed_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE outbox`);
  }
}
