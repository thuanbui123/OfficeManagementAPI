import { GetRoleByName } from "@repositories/RoleRepository";
import { GetPermsList } from "@repositories/PermissionRepository";
import { PermissionModel } from "@models/Permission";
import { RoleModel } from "@models/Role";
import { FilterQuery, Types } from "mongoose";
import UserModel from "@models/User";
import { bustUserPermissionsCache } from "./PermissionsService";

export type RolePermissionItem = {
  _id: string;
  code: string;
  desc?: string;
  selected: boolean;
};

export type RolePermissionsDTO = {
  items: RolePermissionItem[];
};

export type AssignRolePermissionInput = {
  code: string;
  selected: boolean;
};

export type AssignSingleRoleInput =
  | { userId: string; role: string }        
  | { userId: string; roles: string[] };  

function normalizeRoleName(name: string) {
  return name?.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function getRolePermissions(roleName: string): Promise<RolePermissionsDTO | null> {
    const role = await GetRoleByName(roleName);
    if(!role) return null;

    const allPers = await GetPermsList();

    const selected = new Set<string>((role.permissions ?? []) as string[]);

    const items: RolePermissionItem[] = allPers.map(p => ({
        _id: String(p._id),
        code: p.code,
        desc: p.desc,
        selected: selected.has(p.code),
    }));

    return { items };
}

export async function setRolePermissions(roleNameInput: string, items: AssignRolePermissionInput[]) {
  const roleName = normalizeRoleName(roleNameInput);
  if(!roleName) throw new Error("Tên vai trò không hợp lệ!");

  const selectedCode = (items || []).filter(i => i.selected).map(i => i.code?.trim()).filter(Boolean);

  const found = await PermissionModel.find({ code: { $in: selectedCode } }).select({ code: 1 }).lean();
  
  const validCodes = found.map(x => x.code);
  const invalidCodes = selectedCode.filter(c => !validCodes.includes(c));

  const role = await RoleModel.findOneAndUpdate(
    { name: roleNameInput },
    { $set: { permissions: validCodes } },
    { new: true, upsert: false }
  );

  if(!role) throw new Error('Không tìm thấy vai trò để cập nhật!');

  return { role, validCodes, invalidCodes };
}

export type AssignSingleRoleResult = {
  user: { _id: Types.ObjectId; username: string; roles: string[] };
  assignedRole: string;
  ignoredRoles?: string[]; // nếu FE gửi nhiều role, các role dư sẽ bị bỏ qua
};

export async function assignSingleRoleToUserService(
  payload: AssignSingleRoleInput
): Promise<AssignSingleRoleResult> {
  const userId = payload.userId;

  // Lấy roleName theo 2 dạng input
  let roleName = "";
  let ignoredRoles: string[] | undefined;

  if ("role" in payload) {
    roleName = normalizeRoleName(payload.role);
  } else {
    const list = (payload.roles || []).map(normalizeRoleName).filter(Boolean);
    roleName = list[0] || "";
    if (list.length > 1) ignoredRoles = list.slice(1);
  }

  if (!roleName) {
    const err = new Error("Vai trò không hợp lệ.");
    (err as any).status = 400;
    throw err;
  }

  // Kiểm tra role có tồn tại
  const roleDoc = await RoleModel.findOne({ name: roleName })
    .select({ name: 1 })
    .lean();

  if (!roleDoc) {
    const err = new Error("Vai trò không tồn tại.");
    (err as any).status = 400;
    throw err;
  }

  // Cập nhật user: Ép đúng 1 role
  const query: FilterQuery<any> = { _id: userId };
  const projection = { username: 1, roles: 1 };
  const updated = await UserModel.findByIdAndUpdate(
    query,
    { $set: { roles: [roleDoc.name] } }, // replace toàn bộ, chỉ 1 role
    { new: true, projection }
  );

  if (!updated) {
    const err = new Error("Không tìm thấy người dùng để gán vai trò!");
    (err as any).status = 404;
    throw err;
  }

  await bustUserPermissionsCache(String(updated._id));

  return {
    user: updated.toObject(),
    assignedRole: roleDoc.name,
    ...(ignoredRoles?.length ? { ignoredRoles } : {}),
  };
}