import { model, Schema, Document, Types } from 'mongoose';

export const plans = ['free_trial', 'monthly', 'semiannual', 'annual'] as const;
export const subStatuses = ['active', 'expired', 'cancelled'] as const;
export const subPaymentMethods = ['none', 'card', 'transfer'] as const;
export const subPaymentStatuses = ['none', 'pending', 'paid', 'failed'] as const;
export const subPaymentModes = ['none', 'simulated'] as const;

export type Plan = (typeof plans)[number];
export type SubStatus = (typeof subStatuses)[number];

export interface ISubscription extends Document {
  ownerId: Types.ObjectId;
  plan: Plan;
  status: SubStatus;
  startDate: Date;
  endDate: Date;
  paymentMethod: string;
  paymentStatus: string;
  paymentMode: 'none' | 'simulated';
  pendingPlan?: Plan;
  pendingEndDate?: Date;
  trialUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: plans, required: true },
    status: { type: String, enum: subStatuses, required: true, default: 'active' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: subPaymentMethods, required: true },
    paymentStatus: { type: String, enum: subPaymentStatuses, required: true },
    paymentMode: { type: String, enum: subPaymentModes, required: true, default: 'none' },
    pendingPlan: { type: String, enum: plans },
    pendingEndDate: { type: Date },
    trialUsed: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);