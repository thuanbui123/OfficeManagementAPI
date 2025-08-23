import { Request, Response, NextFunction } from "express";

function isSuperAdmin(req: Request) {
  return req.auth?.roles?.includes("superadmin");
}

export function requireRole(...rolesRequired: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isSuperAdmin(req)) return next();
    const roles = req.auth?.roles || [];
    const ok = rolesRequired.some(r => roles.includes(r));
    if (!ok) return res.status(403).send("Bạn thiếu vai trò cần thiết");
    next();
  };
}

export function requirePermission(...permsRequired: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isSuperAdmin(req)) return next();
    const perms = req.auth?.perms || [];
    const ok = permsRequired.every(p => perms.includes(p));
    if (!ok) return res.status(403).send("Bạn không đủ quyền thực hiện tác vụ này");
    next();
  };
}