import { z } from 'zod';
import { connectToDB } from '../../lib/mongodb';
import { getOrderModel } from '../../models/Order';
import { getProductModel } from '../../models/Product';

const createOrderSchema = z.object({
  userId: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1) }))
});

export async function createOrder(input: unknown) {
  const data = createOrderSchema.parse(input);
  await connectToDB();
  const Product = getProductModel();
  const Order = getOrderModel();

  const updatedProducts: any[] = [];

  try {
    // For each item, attempt conditional decrement
    for (const item of data.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, deletedAt: null, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: true }
      ).lean().exec();

      if (!updated) {
        // try to read current stock to provide helpful info
  const existing = await Product.findById(item.productId).lean().exec();
  const available = (existing as any)?.stock ?? 0;
        const err: any = new Error(`Insufficient stock for product ${item.productId}`);
        err.code = 'OUT_OF_STOCK';
        err.productId = item.productId;
        err.available = available;
        throw err;
      }
      updatedProducts.push({ id: item.productId, qty: item.qty });
    }

    // create order doc
    const orderDoc: any = await Order.create({ userId: data.userId || null, items: data.items });

    return { order: orderDoc.toJSON(), updatedProducts };
  } catch (err) {
    // rollback previous decrements - best-effort
    for (const p of updatedProducts) {
      await Product.updateOne({ _id: p.id }, { $inc: { stock: p.qty } }).exec().catch(() => {});
    }
    throw err;
  }
}

export default { createOrder };
