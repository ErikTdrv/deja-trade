import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Env } from '../config/env';
import { TOPIC_CONFIGS } from './topics';

@Injectable()
export class KafkaService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka: KafkaJS.Kafka;
  private readonly producer: KafkaJS.Producer;
  private readonly consumers: KafkaJS.Consumer[] = [];

  constructor(config: ConfigService<Env, true>) {
    this.kafka = new KafkaJS.Kafka({
      kafkaJS: {
        brokers: config.get('KAFKA_BROKERS', { infer: true }).split(','),
        clientId: config.get('KAFKA_CLIENT_ID', { infer: true }),
      },
    });
    this.producer = this.kafka.producer({ kafkaJS: { idempotent: true } });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureTopics();
    await this.producer.connect();
  }

  createConsumer(groupId: string): KafkaJS.Consumer {
    const consumer = this.kafka.consumer({ kafkaJS: { groupId } });
    this.consumers.push(consumer);
    return consumer;
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all(this.consumers.map((c) => c.disconnect()));
    await this.producer.disconnect();
  }

  async publish(
    topic: string,
    messages: { key: string; value: object }[],
  ): Promise<void> {
    await this.producer.send({
      topic,
      messages: messages.map(({ key, value }) => ({
        key,
        value: JSON.stringify(value),
      })),
    });
  }

  private async ensureTopics(): Promise<void> {
    const admin = this.kafka.admin();
    await admin.connect();
    try {
      const existing = new Set(await admin.listTopics());
      const missing = TOPIC_CONFIGS.filter((t) => !existing.has(t.topic));
      if (missing.length > 0) {
        await admin.createTopics({ topics: missing });
        this.logger.log(
          `Created topics: ${missing.map((t) => t.topic).join(', ')}`,
        );
      }
    } finally {
      await admin.disconnect();
    }
  }
}
