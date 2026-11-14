import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NewTrade } from './new-trade';
import { Trade } from './trade.entity';

export interface InsertBatchResult {
  inserted: number;
  duplicates: number;
}

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
  ) {}

  async insertBatch(trades: NewTrade[]): Promise<InsertBatchResult> {.
    if (trades.length === 0) return { inserted: 0, duplicates: 0 };

    const result = await this.tradesRepository
      .createQueryBuilder()
      .insert()
      .values(trades)
      .orIgnore()
      .returning('id')
      .execute();

    // RETURNING only yields rows that were actually inserted.
    const inserted = (result.raw as unknown[]).length;
    return { inserted, duplicates: trades.length - inserted };
  }
}
