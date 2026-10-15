import { model, Schema, Document, Types } from 'mongoose';

export const orderStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentMethods = ['on_delivery', 'card'] as const;
export const paymentStatuses = ['pending', 'paid'] as const;

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IOrder extends Document {
  customerId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false } // No se necesita un ID autogenerado para cada subdocumento de item
);

const orderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: orderStatuses, required: true, default: 'pending' },
    deliveryAddress: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: paymentMethods, required: true, default: 'on_delivery' },
    paymentStatus: { type: String, enum: paymentStatuses, required: true, default: 'pending' },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);