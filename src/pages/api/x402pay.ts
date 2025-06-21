import type { APIRoute } from 'astro';
import { initiateX402Payment } from '../../lib/coinbase';

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
    const paymentUrl = await initiateX402Payment(mediaId, amount, userId, locals);
    return new Response(JSON.stringify({ paymentUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response('x402pay initiation failed', { status: 500 });
  }
};