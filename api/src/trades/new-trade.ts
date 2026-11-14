import type { Trade } from './trade.entity';

export type NewTrade = Omit<Trade, 'id' | 'createdAt' | 'realizedR'>;
