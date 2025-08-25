const key = process.env.STRIPE_SECRET_KEY;

let stripe: any = null;
async function ensureStripe() {
  if (stripe) return stripe;
  if (!key) return null;
  // attempt to require stripe at runtime without letting bundlers statically analyze it
  try {
    // avoid static analysis by using eval to obtain require
    // eslint-disable-next-line no-eval
    const req: any = eval("require");
    const Stripe = req('stripe');
    stripe = new Stripe(key, { apiVersion: '2022-11-15' });
  } catch (e) {
    // stripe unavailable at runtime
    return null;
  }
  return stripe;
}

export async function createPaymentIntent(amountCents: number, currency = 'pen') {
  const s = await ensureStripe();
  if (!s) throw new Error('NO_STRIPE');
  const pi = await s.paymentIntents.create({ amount: amountCents, currency, automatic_payment_methods: { enabled: true } });
  return { id: pi.id, clientSecret: pi.client_secret };
}

export async function retrievePaymentIntent(id: string) {
  const s = await ensureStripe();
  if (!s) throw new Error('NO_STRIPE');
  return s.paymentIntents.retrieve(id);
}
