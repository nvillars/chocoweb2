import connectToDB from '@/lib/mongodb';
import { getOrderModel } from '@/models/Order';
import { getProcessedWebhookModel } from '@/models/ProcessedWebhook';

// Stripe webhook handler (runtime-optional). When STRIPE_WEBHOOK_SECRET is set
// we attempt to validate the signature using the stripe SDK if available.

export async function POST(req: Request) {
  await connectToDB();
  const Order = getOrderModel();

  const bodyText = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: any = null;

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      // runtime require to avoid bundler issues when stripe isn't installed
      // eslint-disable-next-line no-eval
      const reqfn: any = eval('require');
      const Stripe = reqfn('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(bodyText, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (e: any) {
      console.error('Stripe webhook signature verification failed:', e && e.message);
      return new Response('Invalid signature', { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(bodyText);
    } catch (e) {
      console.error('Invalid JSON payload to stripe webhook');
      return new Response('Invalid payload', { status: 400 });
    }
  }

  try {
    const type = event.type;
    const ProcessedWebhook = getProcessedWebhookModel();

    // dedupe by event id if present
    const eventId = event.id;
    if (eventId) {
      try {
        // use raw collection insert to avoid TS overload ambiguity on Model.create
        await ProcessedWebhook.collection.insertOne({ id: eventId });
      } catch (e: any) {
        // duplicate key -> already processed
        if (e && (e.code === 11000 || e.code === 'E11000')) {
          console.log('Webhook event already processed:', eventId);
          return new Response('ok', { status: 200 });
        }
        throw e;
      }
    }

    if (type === 'payment_intent.succeeded' || type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      // find the order by providerId (stored as payment.providerId)
      const ord = await Order.findOne({ 'payment.providerId': pi.id });
      if (!ord) {
        console.warn('Webhook: could not find order for payment intent', pi.id);
        return new Response('ok', { status: 200 });
      }

      if (type === 'payment_intent.succeeded') {
        ord.payment = ord.payment || {};
        ord.payment.status = 'succeeded';
        ord.status = 'paid';
      } else {
        ord.payment = ord.payment || {};
        ord.payment.status = 'failed';
        ord.status = 'failed';
      }

  await ord.save();

      // publish SSE event to notify clients
      try {
        const publish = (globalThis as any).publish;
        if (publish) publish({ type: 'order.updated', payload: { id: ord._id.toString(), status: ord.status } });
      } catch (e) {
        console.warn('Failed publishing webhook SSE', e);
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('Error handling stripe webhook', err);
    return new Response('internal error', { status: 500 });
  }
}
