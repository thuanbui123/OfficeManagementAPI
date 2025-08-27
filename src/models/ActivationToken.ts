import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

const ActivationTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
}, {
    collection: 'activationTokens',
    timestamps: true
});

export type ActivationToken = InferSchemaType<typeof ActivationTokenSchema>;
export type ActivationTokenDoc = HydratedDocument<typeof ActivationTokenSchema>;

const ActivationTokenModel = model<ActivationToken>('ActivationToken', ActivationTokenSchema);
export default ActivationTokenModel;
