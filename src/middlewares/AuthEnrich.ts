import { Request, Response, NextFunction } from "express";
import { getUserPermissionsCached } from "@services/PermissionsService";
const { getUserSnapshotFromReq } = require("@utils/redisUtil");
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        username: string;
        roles: string[];
        perms: string[];
      };
    }
  }
}

export async function enrichAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const snap = await getUserSnapshotFromReq(req);
    if (!snap) return res.status(401).send("Phiên đăng nhập không hợp lệ!");
    const { userId, username, roles = [] } = snap;
    const { perms } = await getUserPermissionsCached(String(userId));
    req.auth = {
      userId: String(userId),
      username: String(username),
      roles: Array.isArray(roles) ? roles : [],
      perms: perms ?? [],
    };
    next();
  } catch (e) {
    console.error("[enrichAuth] error:", (e as Error)?.message);
    res.status(500).send("Không thể tải quyền người dùng");
  }
}