import { RoleModel } from "@models/Role";

export async function GetRoleByName(roleName: string) {
    return await RoleModel.findOne({ name: roleName });
}