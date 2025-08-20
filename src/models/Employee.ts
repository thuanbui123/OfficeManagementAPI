import { Schema, model, InferSchemaType, HydratedDocument, Types } from "mongoose";

const employeeSchema = new Schema (
    {
        userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
        empCode: { type: String, required: true, unique: true },
        fullName: { type: String, required: true, index: true },
        title: { type: String },
        deptId: { type: Types.ObjectId, ref: 'Department', index: true },
        hireDate: { type: Date, default: Date.now },
        salary: { type: Number, default: 0 },
    }, {
        collection: 'employees',
        timestamps: true // tự tạo createdAt, updatedAt
    }
);

export type Employee = InferSchemaType<typeof employeeSchema>;
export type EmployeeDoc = HydratedDocument<Employee>;

export const EmployeeModel = model<Employee>('Employee', employeeSchema);
export default EmployeeModel;
