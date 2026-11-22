import { Subscription } from '../models/subscription.model.js';
import { AppError } from '../utils/app-error.js';
import { parsePagination, requireObjectId } from '../utils/request-validation.js';

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
      paymentMode: 'none',
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

    sub.pendingPlan = plan;
    sub.pendingEndDate = newEndDate;
    sub.paymentMethod = paymentMethod;
    sub.paymentStatus = 'pending';
    sub.paymentMode = 'simulated';

    return await sub.save();
  }

  static async confirmPayment(ownerId: string, data: unknown) {
    requireObjectId(ownerId);
    const body = data && typeof data === 'object' ? data as Record<string, unknown> : {};
    if (body.status !== 'paid' && body.status !== 'failed') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Payment status must be paid or failed');
    }

    const sub = await Subscription.findOne({ ownerId });
    if (!sub) throw new AppError(404, 'NOT_FOUND', 'Subscription record not found');
    if (sub.paymentStatus !== 'pending') {
      throw new AppError(409, 'PAYMENT_NOT_PENDING', 'There is no payment awaiting confirmation');
    }

    sub.paymentStatus = body.status;
    if (body.status === 'paid') {
      if (!sub.pendingPlan || !sub.pendingEndDate) {
        throw new AppError(409, 'PAYMENT_CONFIRMATION_INVALID', 'The pending renewal is incomplete');
      }
      sub.plan = sub.pendingPlan;
      sub.status = 'active';
      sub.endDate = sub.pendingEndDate;
    }
    sub.pendingPlan = undefined;
    sub.pendingEndDate = undefined;
    return await sub.save();
  }

  static async getMySubscription(ownerId: string) {
    requireObjectId(ownerId);
    const sub = await Subscription.findOne({ ownerId });
    if (!sub) {
      throw new AppError(404, 'NOT_FOUND', 'Subscription record not found');
    }

    if (sub.status === 'active' && sub.endDate < new Date()) {
      sub.status = 'expired';
      await sub.save();
    }

    const remainingDays = sub.status === 'active'
      ? Math.max(0, Math.ceil((sub.endDate.getTime() - Date.now()) / 86400000))
      : 0;

    return {
      subscription: sub,
      remainingDays
    };
  }

  static async cancelPendingRenewal(ownerId: string) {
    requireObjectId(ownerId);
    const sub = await Subscription.findOne({ ownerId });
    if (!sub) {
      throw new AppError(404, 'NOT_FOUND', 'Subscription record not found');
    }
    if (sub.paymentStatus !== 'pending' || !sub.pendingPlan) {
      throw new AppError(409, 'NO_PENDING_RENEWAL', 'There is no pending renewal to cancel');
    }

    sub.pendingPlan = undefined;
    sub.pendingEndDate = undefined;
    sub.paymentStatus = 'failed';
    sub.paymentMode = 'simulated';
    return await sub.save();
  }

  static async listSubscriptions(filters: { status?: unknown; plan?: unknown; page?: unknown; limit?: unknown }) {
    const pagination = parsePagination(filters.page, filters.limit);
    const query: Record<string, unknown> = {};

    if (filters.status !== undefined) {
      if (!['active', 'expired', 'cancelled'].includes(String(filters.status))) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid subscription status');
      }
      query.status = filters.status;
    }
    if (filters.plan !== undefined) {
      if (!['free_trial', 'monthly', 'semiannual', 'annual'].includes(String(filters.plan))) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid subscription plan');
      }
      query.plan = filters.plan;
    }

    const [items, total] = await Promise.all([
      Subscription.find(query)
        .populate('ownerId', 'name email isActive')
        .sort('-updatedAt')
        .skip(pagination.skip)
        .limit(pagination.limit),
      Subscription.countDocuments(query)
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit, pages: Math.ceil(total / pagination.limit) };
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