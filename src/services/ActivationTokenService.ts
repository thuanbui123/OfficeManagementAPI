import crypto from "crypto";
import ActivationTokenModel from "@models/ActivationToken";
import { ObjectId } from "mongoose";
import User from "@models/User";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const genRaw = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

export async function createActivationToken(userId: ObjectId, ttlHours = 24) {
  const raw = genRaw(); // token thô (để đưa vào link)
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

  await ActivationTokenModel.create({ userId, tokenHash, expiresAt });
  return { raw, expiresAt };
}


export async function consumeActivationToken(rawToken: string) {
  const tokenHash = sha256(rawToken);

  const token = await ActivationTokenModel.findOne({ tokenHash });
  if (!token) return { ok: false as const, reason: "TOKEN_NOT_FOUND" as const };
  if (token.usedAt) return { ok: false as const, reason: "TOKEN_USED" as const };
  if (token.expiresAt.getTime() < Date.now())
    return { ok: false as const, reason: "TOKEN_EXPIRED" as const };

  await User.updateOne({ _id: token.userId }, { $set: { isActive: true } });
  token.usedAt = new Date();
  await token.save();
  
  await ActivationTokenModel.deleteMany({ userId: token.userId, _id: { $ne: token._id } });

  return { ok: true as const, userId: token.userId.toString() };
}