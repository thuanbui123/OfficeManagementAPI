import { Request, Response } from "express";
import { PermissionModel } from "@models/Permission";
import { RoleModel } from "@models/Role";
import UserModel, { User } from "@models/User";
import { bustUserPermissionsCache } from "@services/PermissionsService";
import { CheckExist } from "@repositories/AccessRepository";
import { getRolePermissions, setRolePermissions, assignSingleRoleToUserService } from "@services/AccessService";

class AccessController {
    async createPermission(req: Request, res: Response) {
        const { code, desc } = req.body;
        if (!code) return res.status(400).json({ err: "Mã quyền truy cập là trường bắt buộc!" });
        const exist = await CheckExist(code);
        if(exist) return res.status(409).json({ err: "Quyền truy cập đã tồn tại!" });
        const doc = await PermissionModel.create({ code, desc });
        res.json(doc);
    }

    async createRole(req: Request, res: Response) {
        try {
            const { name, desc } = req.body;
            const roleName = name.trim().replace(/\s+/g, " ").toLowerCase();
            if (!roleName) return res.status(400).json({ err: "Tên vai trò là trường bắt buộc!" });
            var exist = await RoleModel.exists({ name: roleName });
            if(!!exist) return res.status(409).json({ err: "Tên vai trò đã tồn tại!" });

            const role = await RoleModel.create({ name: roleName, desc });
            return res.status(201).json({ success:  "Tạo vai trò mới thành công!" });
        } catch (err) {
            console.log("Error create role: " + err)
            return res.status(500).json({ err: "Lỗi hệ thống khi tạo mới vai trò!" })
        }
    }

    async getRolePermissions(req: Request, res: Response) {
        try {
            const role = req.query.role;
            if (typeof role !== "string" || !role.trim()) {
              return res.status(400).json({ err: "Tên vai trò là trường bắt buộc!" });
            }
            const roleName = role.toLowerCase();

            const data = await getRolePermissions(roleName);

            return res.status(200).json(data);
        } catch (e) {
            console.log("Error getRolePermissions: " + e);
            return res.status(500).json({ err: "Lỗi hệ thống khi lấy danh sách vai trò!" });
        }
    }

    async updateRolePermissions(req: Request, res: Response) {
        try {
            const { name } = req.params; 
            const { permissions = [] } = req.body;

            const { role, validCodes, invalidCodes } =
                await setRolePermissions(name, permissions);

            return res.json({
                role, validCodes, invalidCodes,
                message:
                    invalidCodes.length
                    ? "Cập nhật xong, một số mã quyền không hợp lệ đã bị bỏ qua."
                    : "Cập nhật thành công."
            });
        } catch(e: any) {
            const msg = e?.message || "Lỗi hệ thống";
            const status = msg.includes("Không tìm thấy vai trò") ? 404 : (msg.includes("Tên vai trò không hợp lệ!") ? 400 : 500);
            return res.status(status).json({ err: msg });
        }
    }

    async assignRoleToUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const body = req.body as { role?: string; roles?: string[] };

            const result = await assignSingleRoleToUserService({
                userId,
                ...(body.role ? { role: body.role } : { roles: body.roles || [] }),
            });
            return res.json({
                msg: "Cập nhật vai trò thành công",
                user: result.user,
                assignedRole: result.assignedRole,
                ...(result.ignoredRoles
                    ? { note: `Đã bỏ qua các role dư: ${result.ignoredRoles.join(", ")}` }
                    : {}),
            });
        } catch (e: any) {
            const status = e?.status || (e?.message?.includes("Không tìm thấy người dùng để gán vai trò!") ? 404 : 
                (e?.message?.includes("Vai trò không hợp lệ.") || e?.message?.includes("Vai trò không tồn tại.") 
                ? 400 : 500)
            );
            return res.status(status).json({ err: e?.message || "Lỗi hệ thống" });
        }
    }
}

export default new AccessController();