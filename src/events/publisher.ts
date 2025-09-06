import { getProducer, waitForTopics } from "@libs/kafka";
import { CompressionTypes, Kafka, logLevel, Producer } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || "kafka:29092").split(",");
const clientId = process.env.KAFKA_CLIENT_ID || "office-mgmt-api";

let producer: Producer | null = null;
let connected = false;

export async function initKafka() {
  if (producer) return;
  const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.ERROR });
  await waitForTopics(kafka, ['employee.events', 'user.events', 'room.events']);
  producer = kafka.producer({
    // để bạn chủ động tạo topic ở compose/init, tránh auto-create
    allowAutoTopicCreation: false,
    retry: { retries: 5, initialRetryTime: 300 },
    idempotent: false, // có thể bật nếu cần exactly-once trong 1 broker
  });
  await producer.connect();
  connected = true;
  console.log("[Kafka] Producer connected:", brokers.join(","));
}

// Headers kiểu kafkajs: string | Buffer
type HeaderValue = string | Buffer;
type Headers = Record<string, string | number | boolean>;

function normalizeHeaders(h: Headers): Record<string, HeaderValue> {
  const out: Record<string, HeaderValue> = {};
  for (const [k, v] of Object.entries(h || {})) {
    // ép về string rồi Buffer (hoặc để string cũng được — kafkajs cho phép)
    out[k] = String(v); // hoặc Buffer.from(String(v))
  }
  return out;
}

export async function publishJSON(
  topic: string,
  key: string | null,
  payload: unknown,
  headers: Headers = {}
) {
  const producer = await getProducer();
  const h = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k, String(v)])
  ); // kafkajs cho phép string hoặc Buffer

  await producer.send({
    topic,
    messages: [{
      key: key ?? undefined,
      value: JSON.stringify(payload),
      headers: h,
    }],
    acks: -1,
  });
}
