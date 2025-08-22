import crypto from "crypto";

export function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function getTokenFromReq(req: import("express").Request) {
  try {
    const b = req.headers.authorization;
    if (typeof b === "string" && b.startsWith("Bearer ")) return b.slice(7).trim();
    const x = req.headers["x-authorization"];
    if (typeof x === "string") return x.trim();
    return null;
  } catch (e) {
    console.log("Error getTokenFromReq: " + e)
  }
}