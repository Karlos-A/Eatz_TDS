import { model, Schema, Document, Types } from 'mongoose';

export interface IMenuItem extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  category?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true },
    available: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

export const MenuItem = model<IMenuItem>('MenuItem', menuItemSchema);