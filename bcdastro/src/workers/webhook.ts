import type { Env } from 'cloudflare:workers';

export default {
  async fetch(request: Request, env: Env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON payload', { status: 400 });
    }

    const url = new URL(request.url);
    const db = env.DB;

    if (!db) {
      return new Response('Database connection unavailable', { status: 500 });
    }

    try {
      if (url.pathname.includes('/webhook/x402')) {
        if (body.type !== 'payment.completed') {
          return new Response('Invalid webhook event', { status: 400 });
        }
        const { id: paymentId, metadata } = body.data;
        if (!metadata?.mediaId || !metadata?.userId) {
          throw new Error('Missing metadata');
        }
        await db.prepare('UPDATE purchases SET x402_payment_id = ? WHERE media_id = ? AND user_id = ?')
          .bind(paymentId, metadata.mediaId, metadata.userId)
          .run();
      } else if (url.pathname.includes('/webhook/stripe')) {
        if (body.type !== 'checkout.session.completed') {
          return new Response('Invalid webhook event', { status: 400 });
        }
        const { id: sessionId, metadata } = body.data.object;
        if (!metadata?.mediaId || !metadata?.userId) {
          throw new Error('Missing metadata');
        }
        await db.prepare('UPDATE purchases SET stripe_payment_id = ? WHERE media_id = ? AND user_id = ?')
          .bind(sessionId, metadata.mediaId, metadata.userId)
          .run();
      } else {
        return new Response('Invalid webhook endpoint', { status: 400 });
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown error');
      return new Response('Webhook processing failed', { status: 500 });
    }
  },
};