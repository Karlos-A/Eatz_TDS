import { model, Schema, Document, Types } from 'mongoose';

export interface IRestaurant extends Document {
  ownerId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

export const Restaurant = model<IRestaurant>('Restaurant', restaurantSchema);