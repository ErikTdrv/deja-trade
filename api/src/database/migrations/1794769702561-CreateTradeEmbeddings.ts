import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTradeEmbeddings1794769702561 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE trade_embeddings (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        trade_id bigint NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
        model text NOT NULL,
        embedding vector(1536) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (trade_id, model)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX trade_embeddings_embedding_idx
        ON trade_embeddings USING hnsw (embedding vector_cosine_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE trade_embeddings`);
  }
}
