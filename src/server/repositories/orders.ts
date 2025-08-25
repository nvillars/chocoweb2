import { z } from 'zod';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { getProductModel } from '../../models/Product';
import { getOrderModel } from '../../models/Order';
import { createPaymentIntent } from '../services/payments/stripe';
import { decrementStockOrThrow, restockItems } from './inventory';
import connectToDB from '../../lib/mongodb';

const Product = getProductModel();
const Order = getOrderModel();

const CreateOrderSchema = z.object({
  userId: z.string().optional(),
  user: z.object({ email: z.string().optional(), name: z.string().optional() }).optional(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1) })),
  paymentMethod: z.enum(['stripe','yape','plin','transfer','cod']).optional()
});

export async function createOrder(input: unknown, opts?: { idempotencyKey?: string }) {
  const parsed = CreateOrderSchema.parse(input);
  await connectToDB();

  // idempotency: if key provided, return existing order created within 5 minutes
  if (opts?.idempotencyKey) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existing = await Order.findOne({ 'metadata.idempotencyKey': opts.idempotencyKey, 'metadata.idempotencyKeyCreatedAt': { $gte: fiveMinutesAgo } }).lean();
    if (existing) return { order: existing };
  }

  // load products
  const pids = parsed.items.map(i => new Types.ObjectId(i.productId));
  const products = await Product.find({ _id: { $in: pids } }).lean();
  const prodMap = new Map(products.map(p => [String(p._id), p]));

  // build items with price cents
  const itemsSnapshot: any[] = [];
  let subtotal = 0;
  for (const it of parsed.items) {
    const p = prodMap.get(it.productId);
    if (!p || (p as any).deletedAt || !(p as any).published) throw { code: 'VALIDATION_ERROR', message: 'Product not available', productId: it.productId };
    const unitPriceCents = Math.round(((p as any).price ?? 0) * 100);
    const line = unitPriceCents * it.qty;
  itemsSnapshot.push({ productId: new Types.ObjectId(it.productId), name: (p as any).name, qty: it.qty, unitPriceCents, lineTotalCents: line });
    subtotal += line;
  }

  const session = await mongoose.startSession();
  // Try transaction first (works on replica sets). If transactions are unavailable
  // (standalone Mongo), fall back to a best-effort, per-document conditional update strategy.
  let usedTransaction = false;
  let appliedItems: { productId: string, qty: number }[] = [];
  try {
    session.startTransaction();
    usedTransaction = true;
    // decrement stock atomically within the session
    appliedItems = await decrementStockOrThrow(session, parsed.items as any);

    const amounts = { subtotalCents: subtotal, shippingCents: 0, taxCents: 0, totalCents: subtotal };
    const orderPayload: any = {
      items: itemsSnapshot,
      amounts,
      payment: { method: parsed.paymentMethod || 'cod', status: 'requires_payment' },
      status: 'pending',
      user: parsed.user || {},
    };
    if (opts?.idempotencyKey) {
      orderPayload.metadata = { idempotencyKey: opts.idempotencyKey, idempotencyKeyCreatedAt: new Date() };
    }

    const orderDoc = await Order.create([orderPayload], { session });

    let clientSecret: string | undefined;
    if (parsed.paymentMethod === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      const pi = await createPaymentIntent(amounts.totalCents, 'pen');
      await Order.updateOne({ _id: orderDoc[0]._id }, { $set: { 'payment.providerId': (pi as any).id } }, { session });
      clientSecret = (pi as any).clientSecret;
    }

  await session.commitTransaction();
  session.endSession();

    // publish SSE for each affected product (minimal payload)
    try {
      const publish = (globalThis as any).publish;
      if (publish) {
        for (const it of itemsSnapshot) {
          publish({ type: 'product.changed', payload: { action: 'update', product: { _id: it.productId, stock: undefined } } });
        }
      }
    } catch (e) { }

    const created = await Order.findById(orderDoc[0]._id).lean();
    return { order: created, clientSecret };
  } catch (err: any) {
    // If error indicates transactions aren't supported, try fallback.
    const msg = String(err?.message || err);
    if (msg.includes('replica set') || msg.includes('Transaction numbers are only allowed')) {
      // abort/cleanup the session if it was started
      try { await session.abortTransaction(); } catch (_) {}
      try { session.endSession(); } catch (_) {}
      // Fallback: perform per-document conditional updates (no session)
      try {
        appliedItems = await decrementStockOrThrow(null, parsed.items as any);

        const amounts = { subtotalCents: subtotal, shippingCents: 0, taxCents: 0, totalCents: subtotal };
        const orderPayload: any = {
          items: itemsSnapshot,
          amounts,
          payment: { method: parsed.paymentMethod || 'cod', status: 'requires_payment' },
          status: 'pending',
          user: parsed.user || {},
        };
        if (opts?.idempotencyKey) {
          orderPayload.metadata = { idempotencyKey: opts.idempotencyKey, idempotencyKeyCreatedAt: new Date() };
        }

        const orderDoc = await Order.create(orderPayload);

        let clientSecret: string | undefined;
        if (parsed.paymentMethod === 'stripe' && process.env.STRIPE_SECRET_KEY) {
          const pi = await createPaymentIntent(amounts.totalCents, 'pen');
          await Order.updateOne({ _id: orderDoc._id }, { $set: { 'payment.providerId': (pi as any).id } });
          clientSecret = (pi as any).clientSecret;
        }

        // publish SSE events
        try {
          const publish = (globalThis as any).publish;
          if (publish) {
            for (const it of itemsSnapshot) {
              publish({ type: 'product.changed', payload: { action: 'update', product: { _id: it.productId, stock: undefined } } });
            }
          }
        } catch (e) { }

        const created = await Order.findById(orderDoc._id).lean();
        return { order: created, clientSecret };
      } catch (fallbackErr) {
        // rollback any applied decrements
        try { await restockItems(null, appliedItems); } catch (_) {}
        throw fallbackErr;
      }
    }

    // other errors - abort transaction and rethrow
    try { await session.abortTransaction(); } catch (_) {}
    try { session.endSession(); } catch (_) {}
    throw err;
  }
}
