import { Request, Response } from "express";
import { PermissionModel } from "@models/Permission";
import { RoleModel } from "@models/Role";
import UserModel, { User } from "@models/User";
import { bustUserPermissionsCache } from "@services/PermissionsService";

class AccessController {
    async createPermission(req: Request, res: Response) {
        const { code, desc } = req.body;
        if (!code) return res.status(400).json({ err: "code is required" });
        const doc = await PermissionModel.create({ code, desc });
        res.json(doc);
    }

    async createRole(req: Request, res: Response) {
        const { name, desc, permissions = [] } = req.body;
        if (!name) return res.status(400).json({ err: "name is required" });

        // validate permission codes (không bắt buộc nhưng nên có)
        const list = await PermissionModel.find({ code: { $in: permissions } }).select({ code: 1 }).lean();
        const validCodes = new Set(list.map(x => x.code));
        const filtered = (permissions as string[]).filter(c => validCodes.has(c));

        const role = await RoleModel.create({ name, desc, permissions: filtered });
        res.json(role);
    }

    async updateRolePermissions(req: Request, res: Response) {
        const { name } = req.params; // role name
        const { permissions = [] } = req.body;

        const list = await PermissionModel.find({ code: { $in: permissions } }).select({ code: 1 }).lean();
        const validCodes = list.map(x => x.code);

        const role = await RoleModel.findOneAndUpdate(
            { name },
            { $set: { permissions: validCodes } },
            { new: true }
        );

        if (!role) return res.status(404).json({ err: "role not found" });
        res.json(role);
    }

    async assignRoleToUser(req: Request, res: Response) {
        const { userId } = req.params;
        const { roles = [] } = req.body as { roles: string[] };

        // validate role names
        const dbRoles = await RoleModel.find({ name: { $in: roles } }).select({ name: 1 }).lean();
        const roleNames = dbRoles.map(r => r.name);

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: { roles: roleNames } },
            { new: true }
        ).select({ username: 1, roles: 1 });

        if (!user) return res.status(404).json({ err: "user not found" });

        await bustUserPermissionsCache(String(user._id)); 
        res.json({ msg: "Cập nhật vai trò thành công", user });
    }
}

export default new AccessController();