import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { initiateStripeCheckout } from '../../lib/initiateStripeCheckout';
import { initiateX402Payment } from '../../lib/coinbase';

interface PurchaseRequest {
  media_id: string;
  method: 'stripe' | 'web3';
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: PurchaseRequest;
  try {
    body = await request.json() as PurchaseRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { media_id, method } = body;
  if (!media_id || !method || !['stripe', 'web3'].includes(method)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid media_id or method' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = locals.DB;
    if (!db) throw new Error('Database connection unavailable');

    // Fetch the media price from database
    const media = await db.prepare('SELECT individual_price FROM media_assets WHERE id = ?')
      .bind(media_id)
      .first();

    if (!media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fiatPriceCents = media.individual_price;
    let paymentUrl: string;

    if (method === 'stripe' && env.STRIPE_SECRET_KEY) {
      // Convert cents to dollars for Stripe
      const priceInDollars = fiatPriceCents / 100;
      const { url } = await initiateStripeCheckout(media_id, priceInDollars, env);
      paymentUrl = url || '';
    } else if (method === 'web3' && env.CDP_API_KEY_SECRET) {
      // Pass cents directly to AgentKit integration
      paymentUrl = await initiateX402Payment(media_id, fiatPriceCents, session.userId, locals);
    } else {
      return new Response(JSON.stringify({ error: 'Payment method not supported or misconfigured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!paymentUrl) {
      throw new Error('Payment URL not generated');
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      method, 
      media_id, 
      payment_url: paymentUrl,
      price_cents: fiatPriceCents 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Purchase error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to initiate purchase' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};