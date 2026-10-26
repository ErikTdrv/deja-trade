import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type TradeDirection = 'BUY' | 'SELL';

// Mirrors CreateTrades1792917025015. The migration is the source of truth;
// keep this in sync by hand.
// bigint and numeric come back from pg as strings to avoid precision loss.
@Entity('trades')
@Unique(['userId', 'journalTradeId'])
export class Trade {
  @PrimaryGeneratedColumn('identity', {
    type: 'bigint',
    generatedIdentity: 'ALWAYS',
  })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'journal_trade_id', type: 'int' })
  journalTradeId: number;

  @Column({ name: 'traded_at', type: 'timestamptz' })
  tradedAt: Date;

  @Column({ type: 'text' })
  instrument: string;

  @Column({ type: 'text' })
  direction: TradeDirection;

  @Column({ name: 'risk_pct', type: 'numeric' })
  riskPct: string;

  @Column({ name: 'planned_rr', type: 'numeric', nullable: true })
  plannedRr: string | null;

  @Column({ name: 'result_usd', type: 'numeric' })
  resultUsd: string;

  @Column({ name: 'result_pct', type: 'numeric' })
  resultPct: string;

  // GENERATED column, computed by Postgres (expression lives in the migration).
  // Read-only here; declaring asExpression would make TypeORM require typeorm_metadata.
  @Column({
    name: 'realized_r',
    type: 'numeric',
    nullable: true,
    insert: false,
    update: false,
  })
  realizedR: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
