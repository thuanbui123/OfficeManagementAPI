import { Request, Response, NextFunction } from "express";
import env from "@config/env";

const { GetUser } = require("@repositories/UserRepository");
import { redis } from "@libs/redis";
import { ensureRedisOpen } from "@libs/redis";
const { decodeToken } = require("@utils/jwt");
const { getTokenFromReq, sha256 } = require("@utils/authUtil");
 
export const isAuth = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const accessTokenFromHeader = getTokenFromReq(req);
    if (!accessTokenFromHeader) {
      return res.status(401).send('Không tìm thấy access token!');
    }

    const accessTokenSecret = env.ACCESS_TOKEN_SECRET;
    if (!accessTokenSecret) {
      console.error('[isAuth] ACCESS_TOKEN_SECRET is missing');
      return res.status(500).send('Cấu hình máy chủ thiếu ACCESS_TOKEN_SECRET');
    }

    let decoded: any;
    try {
      decoded = await decodeToken(accessTokenFromHeader, accessTokenSecret);
    } catch (e) {
      console.warn('[isAuth] decodeToken failed:', (e as Error)?.message);
      return res
        .status(401)
        .send('Access token không hợp lệ hoặc đã hết hạn!');
    }

    if (!decoded) {
      return res
        .status(401)
        .send('Bạn không có quyền truy cập vào tính năng này!');
    }

    // Lấy username từ payload ưu tiên
    const username =
      decoded?.payload?.username ??
      decoded?.username ?? // fallback nếu bạn từng encode phẳng
      '';

    if (!username) {
      console.warn('[isAuth] Missing username in token payload');
      return res.status(401).send('Token thiếu thông tin người dùng!');
    }

    let user: any = null;
    try {
      user = await GetUser(username, '');
    } catch (e) {
      console.error('[isAuth] GetUser error:', (e as Error)?.message);
      return res.status(500).send('Lỗi khi truy vấn người dùng');
    }
    if (!user) {
      return res.status(401).send('Người dùng không tồn tại!');
    }

    const now = Math.floor(Date.now() / 1000);
    const exp =
      typeof decoded.exp === 'number' && decoded.exp > now
        ? decoded.exp
        : now + 15 * 60;

    const ttl = Math.max(5, exp - now);
    const jti = (decoded.jti as string) || sha256(accessTokenFromHeader);
    const sessionKey = `auth:sess:${jti}`;

    const snapshot = {
      userId: user._id,
      username: user?.username ?? username,
      roles: user?.roles ?? decoded?.roles ?? [],
      iat: decoded.iat ?? now,
      exp,
      ip: req.ip,
      ua: req.headers['user-agent'] || '',
    };

    try {
      await ensureRedisOpen();
      await redis.set(sessionKey, JSON.stringify(snapshot), { EX: ttl });
    } catch (e) {
      // Không nên chặn request chỉ vì cache lỗi (tùy yêu cầu)
      console.error('[isAuth] redis.set failed:', (e as Error)?.message);
    }

    return next();
  } catch (err) {
    // Bất kỳ lỗi ngoài dự kiến nào
    console.error('[isAuth] unexpected error:', err);
    // Tránh lộ chi tiết ở production
    return res.status(500).json({
      err: 'Internal Server Error',
      // detail: process.env.NODE_ENV === 'development' ? String(err) : undefined,
    });
  }
};