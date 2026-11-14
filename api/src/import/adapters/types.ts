import type { NewTrade } from '../../trades/new-trade';

export type ParsedTrade = Omit<NewTrade, 'userId'>;

export type MapRowResult =
  { ok: true; trade: ParsedTrade } | { ok: false; reasons: string[] };
