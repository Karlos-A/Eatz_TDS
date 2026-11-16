import { Subscription } from '../models/subscription.model.js';
import { AppError } from '../utils/app-error.js';
import { requireObjectId } from '../utils/request-validation.js';

export class SubscriptionService {
  static async createFreeTrial(ownerId: string) {
    requireObjectId(ownerId);
    
    const existing = await Subscription.findOne({ ownerId });
    if (existing) {
      throw new AppError(409, 'TRIAL_ALREADY_USED', 'This client already has a subscription record');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 31); // 31 días de free trial

    return await Subscription.create({
      ownerId,
      plan: 'free_trial',
      status: 'active',
      startDate,
      endDate,
      paymentMethod: 'none',
      paymentStatus: 'none',
      trialUsed: true
    });
  }
  static async subscribe(ownerId: string, data: any) {
    requireObjectId(ownerId);
    const { plan, paymentMethod } = data;

    if (!['monthly', 'semiannual', 'annual'].includes(plan)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid plan selected');
    }
    if (!['card', 'transfer'].includes(paymentMethod)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid payment method');
    }

    const sub = await Subscription.findOne({ ownerId });
    if (!sub) throw new AppError(404, 'NOT_FOUND', 'Subscription record not found');

    const now = new Date();
    const baseDate = sub.endDate > now ? sub.endDate : now;
    const newEndDate = new Date(baseDate);

    if (plan === 'monthly') newEndDate.setDate(newEndDate.getDate() + 30);
    if (plan === 'semiannual') newEndDate.setDate(newEndDate.getDate() + 180);
    if (plan === 'annual') newEndDate.setDate(newEndDate.getDate() + 365);

    sub.plan = plan;
    sub.status = 'active';
    sub.endDate = newEndDate;
    sub.paymentMethod = paymentMethod;
    sub.paymentStatus = 'paid'; // Se simula el cobro

    return await sub.save();
  }

  static async processExpiredSubscriptions() {
    const now = new Date();
    const result = await Subscription.updateMany(
      { status: 'active', endDate: { $lt: now } },
      { $set: { status: 'expired' } }
    );
    return {
      message: 'Expiration sweep completed',
      expiredCount: result.modifiedCount
    };
  }
  static async assertActiveSubscription(ownerId: string) {
    const sub = await Subscription.findOne({ ownerId });
    if (!sub) {
      throw new AppError(403, 'SUBSCRIPTION_REQUIRED', 'A subscription is required to perform this action');
    }

    const now = new Date();
    if (sub.status === 'active' && sub.endDate < now) {
      sub.status = 'expired';
      await sub.save();
    }

    if (sub.status !== 'active') {
      throw new AppError(403, 'SUBSCRIPTION_EXPIRED', 'Your subscription has expired. Please renew your plan.');
    }
    
    return true;
  }
}