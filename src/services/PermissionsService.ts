import { redis } from "@libs/redis";
import { ensureRedisOpen } from "@libs/redis";
import { GetUserRolesByUserId, GetPermsByRoles } from "@repositories/AccessRepository";

const PERM_TTL_SECONDS = 5 * 60;

export async function getUserPermissionsCached(userId: string) {
  await ensureRedisOpen();
  const key = `auth:perm:${userId}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as { perms: string[]; permVersion?: number };

  const roles = await GetUserRolesByUserId(userId);
  const perms = await GetPermsByRoles(roles);

  const payload = { perms, permVersion: Date.now() };
  await redis.set(key, JSON.stringify(payload), { EX: PERM_TTL_SECONDS });
  return payload;
}

export async function bustUserPermissionsCache(userId: string) {
  await redis.del(`auth:perm:${userId}`);
}