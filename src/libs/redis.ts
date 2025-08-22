import { createClient } from "redis";
import env from "@config/env";

export const redis = createClient({
  url: env.REDIS_URL || "redis://127.0.0.1:6379",
});

redis.on("error", (e) => console.error("Redis error:", e));
export async function initRedis() {
  if (!redis.isOpen) await redis.connect();
}