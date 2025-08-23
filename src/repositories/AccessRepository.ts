import UserModel, { User } from "@models/User";
import { RoleModel } from "@models/Role";

export async function GetUserRolesByUserId(userId: string): Promise<string[]> {
  const user = await UserModel.findById(userId).select({ roles: 1 }).lean();
  return user?.roles ?? [];
}

export async function GetPermsByRoles(roleNames: string[]): Promise<string[]> {
  if (!roleNames?.length) return [];
  const roles = await RoleModel
    .find({ name: { $in: roleNames } })
    .select({ permissions: 1 })
    .lean();

  const set = new Set<string>();
  for (const r of roles) (r.permissions ?? []).forEach(p => set.add(p));
  return Array.from(set);
}
