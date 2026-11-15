export const TOPICS = {
  TRADES_CREATED: 'trades.created',
} as const;

export const TOPIC_CONFIGS = [
  { topic: TOPICS.TRADES_CREATED, numPartitions: 3, replicationFactor: 1 },
];
