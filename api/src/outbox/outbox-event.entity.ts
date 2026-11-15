import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type OutboxPayload = Record<string, string | number | boolean | null>;

@Entity('outbox')
export class OutboxEvent {
  @PrimaryGeneratedColumn('identity', {
    type: 'bigint',
    generatedIdentity: 'ALWAYS',
  })
  id: string;

  @Column({ name: 'event_type', type: 'text' })
  eventType: string;

  @Column({ name: 'aggregate_id', type: 'text' })
  aggregateId: string;

  @Column({ type: 'jsonb' })
  payload: OutboxPayload;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;
}
