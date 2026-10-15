import { model, Schema, Document } from 'mongoose';

export const roles = ['client', 'user'] as const;
export type Role = (typeof roles)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true, default: 'user' }
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);