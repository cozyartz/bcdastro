import type { APIRoute } from 'astro';
import { initiateX402Payment } from '../../lib/coinbase';
import { getSession } from '../../lib/auth';

interface X402PayRequest {
  mediaId: string;
  amount: number;
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: X402PayRequest;
  try {
    body = await request.json() as X402PayRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { mediaId, amount } = body;
  if (!mediaId || typeof mediaId !== 'string' || !amount || typeof amount !== 'number' || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Missing or invalid mediaId or amount' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const paymentUrl = await initiateX402Payment(mediaId, amount, session.userId, locals);
    if (!paymentUrl) throw new Error('Payment URL not generated');

    return new Response(JSON.stringify({ paymentUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('x402pay initiation error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'x402pay initiation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};