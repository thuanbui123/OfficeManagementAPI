import { Schema, model, InferSchemaType } from "mongoose";

const PermissionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true }, // vd: "article:create"
    desc: { type: String, default: "" },
  },
  { 
    collectioon: 'permissions',
    timestamps: true, 
    versionKey: false
  }
);

export type PermissionDoc = InferSchemaType<typeof PermissionSchema>;
export const PermissionModel = model<PermissionDoc>("permissions", PermissionSchema);
