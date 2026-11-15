import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OutboxEvent, type OutboxPayload } from './outbox-event.entity';

export interface NewOutboxEvent {
  eventType: string;
  aggregateId: string;
  payload: OutboxPayload;
}

@Injectable()
export class OutboxService {
  // Takes the caller's manager so the event is written in the caller's transaction.
  async enqueue(
    manager: EntityManager,
    events: NewOutboxEvent[],
  ): Promise<void> {
    if (events.length === 0) return;
    await manager.insert(OutboxEvent, events);
  }

  async getUnprocessedRows(
    manager: EntityManager,
    limit: number,
  ): Promise<OutboxEvent[]> {
    return manager
      .createQueryBuilder(OutboxEvent, 'o')
      .where('o.processedAt IS NULL')
      .setLock('for_no_key_update')
      .setOnLocked('skip_locked')
      .limit(limit)
      .orderBy('o.id')
      .getMany();
  }

  async markProcessed(manager: EntityManager, ids: string[]): Promise<void> {
    await manager
      .createQueryBuilder(OutboxEvent, 'o')
      .update(OutboxEvent)
      .set({ processedAt: () => 'now()' })
      .where('id IN (:...ids)', { ids })
      .execute();
  }
}
