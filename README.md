# Deja Trade

You've seen this setup before. Here's how it ended.

Import your trades, find similar past setups, and ask questions about your own trading history.

**Stack:** NestJS, Postgres + pgvector, Kafka (outbox pattern), Redis

## Scope
- **v1:** CSV import (stream parsing, idempotent inserts), embeddings of trade descriptions, similar-trade search with outcome stats, stats tool, LLM agent
- **v2:** Chart screenshot analysis (vision), economic calendar context
- **v3:** Confirmations analytics, mistake clustering