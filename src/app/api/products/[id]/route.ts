import { NextResponse } from 'next/server';
import { updateProduct, softDeleteProduct } from '../../../../server/repositories/products';
import { publish } from '../../../../lib/events';

export async function GET(req: Request, context: any) {
  // optional: fetch single product (not implemented in repo currently)
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PATCH(req: Request, context: any) {
  try {
    const body = await req.json();
  const { id } = (await context.params) as { id: string };
  const prod = await updateProduct(id, body);
    publish({ type: 'product.changed', payload: { action: 'update', product: prod } });
    return NextResponse.json(prod);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
  const { id } = (await context.params) as { id: string };
  const prod = await softDeleteProduct(id);
    publish({ type: 'product.changed', payload: { action: 'delete', product: prod } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
