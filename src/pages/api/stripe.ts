import type { APIRoute } from 'astro';
import { initiateStripeCheckout } from '../../lib/stripe';

export const POST: APIRoute = async ({ request, params, locals }) => {
  const { mediaId, amount } = await request.json();
  if (!mediaId || !amount) {
    return new Response('Missing mediaId or amount', { status: 400 });
  }

  const userId = await import('../../lib/auth').verifyJWT(
    request.headers.get('Authorization'),
    import.meta.env.JWT_SECRET
  );
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const paymentUrl = await initiateStripeCheckout(mediaId, amount);
    await locals.DB.prepare('INSERT INTO purchases (id, user_id, media_id, stripe_payment_id, price_paid) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), userId, mediaId, paymentUrl.id, amount * 100)
      .run();
    return new Response(JSON.stringify({ paymentUrl: paymentUrl.url }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response('Stripe payment initiation failed', { status: 500 });
  }
};