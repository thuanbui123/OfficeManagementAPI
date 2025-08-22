import { redis } from "@libs/redis";
import { getTokenFromReq, sha256 } from "@utils/authUtil";
const { decodeToken } = require("@utils/jwt");
const env = require("@config/env")

export async function getUserSnapshotFromReq(req: import("express").Request) {
  const token = getTokenFromReq(req);
  if (!token) return null;

  try {
    const payload = decodeToken(token, env.ACCESS_TOKEN_SECRET);
    const jti = (payload.jti as string) || sha256(token);
    const key = `auth:sess:${jti}`;
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}