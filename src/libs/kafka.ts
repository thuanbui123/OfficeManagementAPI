// src/libs/kafka.ts
import {
  Kafka,
  logLevel,
  type Producer,
  type Consumer,
  type EachMessagePayload,
} from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS ?? 'kafka:29092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID ?? 'office-mgmt-api';

const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.ERROR });

let _producer: Producer | null = null;
const _consumers = new Set<Consumer>();

/** Lấy singleton Producer (tự connect nếu chưa) */
export async function getProducer(): Promise<Producer> {
  if (!_producer) {
    _producer = kafka.producer({
      allowAutoTopicCreation: false,
      retry: { retries: 5, initialRetryTime: 300 },
    });
    await _producer.connect();
    // eslint-disable-next-line no-console
    console.log('[Kafka] Producer connected:', brokers.join(','));
  }
  return _producer;
}

export const ensureProducer = getProducer;

/** Tạo & connect một Consumer, có quản lý để shutdown gọn */
export async function createConsumer(groupId: string): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  _consumers.add(consumer);
  // eslint-disable-next-line no-console
  console.log(`[Kafka] Consumer connected (group=${groupId})`);
  return consumer;
}

/** Ngắt kết nối tất cả (gọi khi shutdown) */
export async function disconnectKafka(): Promise<void> {
  await Promise.allSettled([
    _producer?.disconnect(),
    ...Array.from(_consumers).map(c => c.disconnect()),
  ]);
  _consumers.clear();
  _producer = null;
}

export async function waitForTopics(kafka: Kafka, topics: string[], timeoutMs = 15000) {
  const admin = kafka.admin();
  await admin.connect();
  const start = Date.now();
  while (true) {
    const md = await admin.fetchTopicMetadata({ topics });
    const ok = topics.every(t => md.topics.find(x => x.name === t)?.partitions?.length! > 0);
    if (ok) break;
    if (Date.now() - start > timeoutMs) throw new Error(`Topics not ready: ${topics.join(', ')}`);
    await new Promise(r => setTimeout(r, 500));
  }
  await admin.disconnect();
}

// Re-export type để dùng ở chỗ worker cho tiện
export type { EachMessagePayload };
