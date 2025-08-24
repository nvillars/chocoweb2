import { NextResponse } from 'next/server';
import { createOrder } from '../../../server/repositories/orders';
import { publish } from '../../../lib/events';
import { connectToDB } from '../../../../src/lib/mongodb';
import { getOrderModel } from '../../../../src/models/Order';

export async function GET() {
  try {
    await connectToDB();
    const Order = getOrderModel();
    const orders = await Order.find().lean().exec();
    return NextResponse.json(orders.map(o => ({ ...o })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order, updatedProducts } = await createOrder(body);
    for (const p of updatedProducts) {
      publish({ type: 'product.changed', payload: { action: 'update', product: p } });
    }
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    if (err && err.code === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: 'OUT_OF_STOCK', productId: err.productId, available: err.available }, { status: 409 });
    }
    if (err.message && err.message.includes('Insufficient')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || String(err) }, { status: 400 });
  }
}
