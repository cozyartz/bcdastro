import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { initiateStripeCheckout } from '../../../bcdastro/src/lib/stripe';
import { initiateX402Payment } from '../../lib/coinbase';

interface PurchaseRequest {
  media_id: string;
  method: 'stripe' | 'web3';
  amount?: number; // Optional for now, to be required later
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

  const { media_id, method, amount } = body;
  if (!media_id || !method || !['stripe', 'web3'].includes(method)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid media_id or method' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let paymentUrl: string;
    if (method === 'stripe' && env.STRIPE_SECRET_KEY) {
      const price = amount || 0; // Fetch price from media table later
      const { url } = await initiateStripeCheckout(media_id, price, env);
      paymentUrl = url || '';
    } else if (method === 'web3' && env.CDP_API_KEY_SECRET) {
      const price = amount || 0; // Fetch price from media table later
      paymentUrl = await initiateX402Payment(media_id, price, session.userId, locals);
    } else {
      return new Response(JSON.stringify({ error: 'Payment method not supported or misconfigured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!paymentUrl) {
      throw new Error('Payment URL not generated');
    }

    return new Response(JSON.stringify({ ok: true, method, media_id, payment_url: paymentUrl }), {
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