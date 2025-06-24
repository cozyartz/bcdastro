import Stripe from 'stripe';
import { crypto } from 'crypto';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

interface CheckoutResponse {
  id: string;
  url: string | null;
}

export async function initiateStripeCheckout(mediaId: string, price: number, env: any): Promise<CheckoutResponse> {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is missing');
  if (!price || isNaN(price) || price <= 0) throw new Error('Invalid price');

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `BCDAstro Media ${mediaId}`,
            description: 'Premium drone footage',
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${env.SITE_URL}/media/${mediaId}?success=true`,
      cancel_url: `${env.SITE_URL}/media/${mediaId}`,
      metadata: { mediaId, price: Math.round(price * 100), purchaseId: crypto.randomUUID() },
      payment_intent_data: { description: `Purchase of Media ${mediaId}` },
      idempotency_key: crypto.randomUUID(), // Prevent duplicate sessions
    });

    if (!session.url) throw new Error('Checkout session URL not generated');

    await env.D1?.prepare(`
      INSERT INTO purchases (id, user_id, media_id, method, stripe_payment_id, price_paid, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      session.metadata.purchaseId,
      'user123', // Replace with actual userId from session
      mediaId,
      'stripe',
      session.id,
      Math.round(price * 100)
    ).run().catch((err) => {
      console.warn('DB insert failed:', err.message);
    });

    return { id: session.id, url: session.url };
  } catch (error) {
    console.error('Stripe checkout error:', error instanceof Error ? error.message : 'Unknown error');
    throw error; // Re-throw for upstream handling
  }
}