import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, minlength: 10, required: true },
    username: { type: String, minlength: 1, required: true },
    password: { type: String, minlength: 6, required: true },
    lastPass: { type: String, minlength: 6, required: false },
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    img: { type: String, default: "https://viblo.asia/images/vi-flag-32x48.png" },
    loginFalse: { type: Number, default: 0 },        
    refreshToken: { type: String, required: false },  
    roles: { type: [String], default: [] },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;

const UserModel = model<User>("User", userSchema);
export default UserModel;
