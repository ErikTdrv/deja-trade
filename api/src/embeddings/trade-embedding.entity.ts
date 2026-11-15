import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export const EMBEDDING_DIMENSIONS = 1536;

@Entity('trade_embeddings')
@Unique(['tradeId', 'model'])
export class TradeEmbedding {
  @PrimaryGeneratedColumn('identity', {
    type: 'bigint',
    generatedIdentity: 'ALWAYS',
  })
  id: string;

  @Column({ name: 'trade_id', type: 'bigint' })
  tradeId: string;

  @Column({ type: 'text' })
  model: string;

  @Column({ type: 'vector', length: EMBEDDING_DIMENSIONS })
  embedding: number[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
