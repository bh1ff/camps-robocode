import Stripe from 'stripe';

const _instances = new Map<string, Stripe>();

export function getStripe(secretKey?: string | null): Stripe {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  let instance = _instances.get(key);
  if (!instance) {
    instance = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
    });
    _instances.set(key, instance);
  }
  return instance;
}
