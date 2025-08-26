import { PermissionModel } from "@models/Permission";

export async function GetPermsList() {
    return await PermissionModel.find({}).select({ code: 1, desc: 1 }).lean();
}