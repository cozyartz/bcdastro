import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { initializeAgent } from '../../lib/agentkit';
import { crypto } from 'crypto';

interface ChargeRequest {
  local_price: { amount: string; currency: string };
  metadata: { mediaId: string; userId: string };
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: ChargeRequest;
  try {
    body = await request.json() as ChargeRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { local_price, metadata } = body;
  if (
    !local_price?.amount ||
    !local_price?.currency ||
    local_price.currency !== 'USDC' ||
    !metadata?.mediaId ||
    !metadata?.userId ||
    typeof metadata.mediaId !== 'string' ||
    typeof metadata.userId !== 'string'
  ) {
    return new Response(JSON.stringify({ error: 'Missing or invalid required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.CDP_API_KEY_SECRET) {
    return new Response(JSON.stringify({ error: 'API key missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const agent = initializeAgent(env);
  try {
    const amount = parseFloat(local_price.amount);
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

    const transactionHash = await agent.processPayment(metadata.mediaId, metadata.userId, amount);
    if (!transactionHash) throw new Error('AgentKit payment processing failed');

    const response = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': env.CDP_API_KEY_SECRET,
      },
      body: JSON.stringify({
        local_price,
        metadata,
        naming: { checkoutPage: `Purchase ${metadata.mediaId} on BCDAstro` },
        idempotencyKey: crypto.randomUUID(), // Prevent duplicate charges
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Charge creation failed');
    }

    const data = await response.json();
    const chargeId = data.id;

    await locals.DB?.prepare(`
      INSERT INTO purchases (id, user_id, media_id, method, stripe_payment_id, tx_hash, price_paid, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      crypto.randomUUID(),
      metadata.userId,
      metadata.mediaId,
      'web3',
      chargeId,
      transactionHash,
      Math.round(amount * 100)
    ).run().catch((err) => {
      console.error('DB insert error:', err.message);
      throw err; // Re-throw to trigger catch block
    });

    return new Response(JSON.stringify({ id: chargeId, url: data.hosted_url, txHash: transactionHash }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Charge creation error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create charge' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};