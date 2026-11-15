import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { setTimeout as sleep } from 'node:timers/promises';
import { DataSource } from 'typeorm';
import { KafkaService } from '../kafka/kafka.service';
import { EVENT_TOPICS } from './event-topics';
import { OutboxEvent } from './outbox-event.entity';
import { OutboxService } from './outbox.service';

const BATCH_SIZE = 100;
const IDLE_DELAY_MS = 1000;
const ERROR_DELAY_MS = 5000;

// Polls the outbox and publishes pending events to Kafka.
@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelay.name);
  private running = false;
  private loop?: Promise<void>;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly dataSource: DataSource,
    private readonly kafkaService: KafkaService,
  ) {}

  onApplicationBootstrap(): void {
    this.running = true;
    this.loop = this.run();
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    await this.loop;
  }

  private async run(): Promise<void> {
    while (this.running) {
      let delay = IDLE_DELAY_MS;
      try {
        const published = await this.processBatch();
        if (published === BATCH_SIZE) delay = 0;
      } catch (error) {
        this.logger.error('Outbox batch failed', error);
        delay = ERROR_DELAY_MS;
      }
      if (delay > 0) await sleep(delay);
    }
  }

  private async processBatch(): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const events = await this.outboxService.getUnprocessedRows(
        manager,
        BATCH_SIZE,
      );
      if (events.length === 0) return 0;

      for (const [topic, group] of this.groupByTopic(events)) {
        await this.kafkaService.publish(
          topic,
          group.map((event) => ({
            key: event.aggregateId,
            value: {
              eventId: event.id,
              eventType: event.eventType,
              occurredAt: event.createdAt,
              payload: event.payload,
            },
          })),
        );
      }

      await this.outboxService.markProcessed(
        manager,
        events.map((event) => event.id),
      );
      return events.length;
    });
  }

  private groupByTopic(events: OutboxEvent[]): Map<string, OutboxEvent[]> {
    const groups = new Map<string, OutboxEvent[]>();
    for (const event of events) {
      const topic = EVENT_TOPICS[event.eventType];
      if (!topic) throw new Error(`No topic for event type ${event.eventType}`);
      groups.set(topic, [...(groups.get(topic) ?? []), event]);
    }
    return groups;
  }
}
