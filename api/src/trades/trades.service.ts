import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OutboxService } from '../outbox/outbox.service';
import type { NewTrade } from './new-trade';
import { Trade } from './trade.entity';

export interface InsertBatchResult {
  inserted: number;
  duplicates: number;
}

@Injectable()
export class TradesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
  ) {}

  async insertBatch(trades: NewTrade[]): Promise<InsertBatchResult> {
    if (trades.length === 0) return { inserted: 0, duplicates: 0 };

    const inserted = await this.dataSource.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder(Trade, 't')
        .insert()
        .values(trades)
        .orIgnore()
        .returning('id')
        .execute();

      // RETURNING only yields actually inserted rows, so duplicates get no event.
      const ids = (result.raw as { id: string }[]).map((row) => row.id);

      await this.outboxService.enqueue(
        manager,
        ids.map((id) => ({
          eventType: 'TradeCreated',
          aggregateId: id,
          payload: { tradeId: id },
        })),
      );

      return ids.length;
    });

    return { inserted, duplicates: trades.length - inserted };
  }
}
