import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

const departmentSchema = new Schema (
    {
        code: { type: String, required: true, unique: true },
        name: { type: String, required: true },
    }, {
        collection: 'departments',
        timestamps: true // tự tạo createdAt, updatedAt
    }
);

export type Department = InferSchemaType<typeof departmentSchema>;
export type DepartmentDoc = HydratedDocument<Department>;

const DepartmentModel = model<Department>('Department', departmentSchema);
export default DepartmentModel;
