import crypto from "crypto";
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';

type ReqOrHeaders = Request | IncomingHttpHeaders | Record<string, any> | null | undefined;
export function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function getTokenFromReq(reqOrHeaders: ReqOrHeaders): string | null {
  try {
    // Cho phép truyền cả req hoặc headers trực tiếp
    const headers: Record<string, any> | undefined =
      (reqOrHeaders as any)?.headers
        ? (reqOrHeaders as any).headers // Express Request
        : (reqOrHeaders as any);        // Headers object

    if (!headers || typeof headers !== 'object') return null;

    // Express chuẩn hoá header thành lowercase
    const auth = headers['authorization'] ?? headers['Authorization'];
    if (typeof auth === 'string') {
      if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
      return auth.trim(); // fallback: không có "Bearer "
    }

    // Hỗ trợ custom header
    const x = headers['x-authorization'] ?? headers['x_authorization'];
    if (typeof x === 'string') return x.trim();

    return null;
  } catch (e) {
    console.log('Error getTokenFromReq:', e);
    return null;
  }
}
