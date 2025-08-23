import { Schema, model, InferSchemaType } from "mongoose";

const RoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true }, // vd: "admin", "editor"
    desc: { type: String, default: "" },
    permissions: { type: [String], default: [] },
  },
  { 
    collection: 'roles',
    timestamps: true, 
    versionKey: false 
  }
);

export type RoleDoc = InferSchemaType<typeof RoleSchema>;
export const RoleModel = model<RoleDoc>("roles", RoleSchema);
