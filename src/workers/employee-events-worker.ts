import {
  createConsumer,
  disconnectKafka,
  type EachMessagePayload,
} from '@libs/kafka';
import { CreateEmployee } from '@repositories/EmployeeRepository';

const GROUP = process.env.KAFKA_EMP_WORKER_GROUP ?? 'employee-events-worker';
const TOPIC = process.env.KAFKA_EMP_TOPIC ?? 'employee.events';
const db = require("@config/db/index");
db.connect();
async function processEvent(payload: any) {
  switch (payload?.eventType) {
    case 'EmployeeCreated':
      await CreateEmployee(payload);
      break;
    case 'EmployeeUpdated':
      console.log('✏️  Employee updated:', {
        code: payload.empCode,
        changes: payload.changes,
      });
      break;
    default:
      console.warn('Unknown eventType:', payload?.eventType);
  }
}

async function main() {
  const consumer = await createConsumer(GROUP);
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  await consumer.run({
    autoCommit: false,
    // ✅ Gán type để tránh TS7031 (implicitly any)
    eachMessage: async (payload: EachMessagePayload) => {
      const { topic, partition, message, heartbeat } = payload;
      const valueStr = message.value?.toString() || '{}';

      try {
        const data = JSON.parse(valueStr);
        await processEvent(data);

        // Dùng BigInt để an toàn offset lớn
        const nextOffset = (BigInt(message.offset) + 1n).toString();
        await consumer.commitOffsets([{ topic, partition, offset: nextOffset }]);
      } catch (err) {
        console.error('❌ Process error, will retry:', (err as Error).message, 'raw:', valueStr);
        // TODO: publish dead-letter nếu cần
      } finally {
        await heartbeat();
      }
    },
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('👋 Shutting down worker...');
    await disconnectKafka();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(e => {
  console.error('Worker crashed:', e);
  process.exit(1);
});
