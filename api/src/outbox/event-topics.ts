import { TOPICS } from '../kafka/topics';

export const EVENT_TOPICS: Record<string, string> = {
  TradeCreated: TOPICS.TRADES_CREATED,
};
