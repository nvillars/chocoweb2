import { NextResponse, NextRequest } from 'next/server';
import connectToDB from '../../../../lib/mongodb';
import { getOrderModel } from '../../../../models/Order';

export async function GET(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }>; }) {
  try {
    await connectToDB();
    const Order = getOrderModel();
  // params may be a Promise in some Next versions
  const params = (context.params && typeof (context.params as any).then === 'function') ? await (context.params as any) : context.params as { id: string };
  const id = params.id;

    // parse cookie like other endpoints: demo session ladulceria_auth
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader
        .split(';')
        .map((c) => c.split('='))
        .map(([k = '', ...v]) => [k.trim(), v.join('=')])
        .filter(([k]) => k)
    );
    const raw = cookies['ladulceria_auth'];
    if (!raw) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    let session: any = null;
    try { session = JSON.parse(decodeURIComponent(raw)); } catch (e) { return NextResponse.json({ error: 'Invalid session' }, { status: 400 }); }

    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // only admins or the owning user may view the order
      const ord: any = order;
      if (session.role === 'admin' || (session.email && ord.user && ord.user.email === session.email)) {
        return NextResponse.json(ord);
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
