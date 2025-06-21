export default {
  async fetch(request: Request, env: any) {
    if (request.method !== 'POST') {
      return new Response('Invalid request', { status: 400 });
    }

    const url = new URL(request.url);
    const body = await request.json();

    if (url.pathname.includes('/webhook/x402')) {
      if (body.type === 'payment.completed') {
        const payment = body.data;
        const { mediaId, userId } = payment.metadata;
        await env.DB.prepare('UPDATE purchases SET x402_payment_id = ? WHERE media_id = ? AND user_id = ?')
          .bind(payment.id, mediaId, userId)
          .run();
      }
    } else if (url.pathname.includes('/webhook/stripe')) {
      if (body.type === 'checkout.session.completed') {
        const session = body.data.object;
        const { mediaId, userId } = session.metadata;
        await env.DB.prepare('UPDATE purchases SET stripe_payment_id = ? WHERE media_id = ? AND user_id = ?')
          .bind(session.id, mediaId, userId)
          .run();
      }
    } else {
      return new Response('Invalid webhook', { status: 400 });
    }

    return new Response('OK', { status: 200 });
  },
};