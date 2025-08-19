import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

const userSchema = new Schema(
    {
        username: { type: String, minlength: 1, required: true },
        password: { type: String, minlength: 6, required: true },
        img: { type: String },
    }, {
        collection: 'users',
        timestamps: true // tự tạo createdAt, updatedAt
    }
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;

const UserModel = model<User>('User', userSchema);
export default UserModel;
