import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

export async function initiateStripeCheckout(mediaId: string, price: number) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Media ${mediaId}` },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${import.meta.env.SITE_URL}/media/${mediaId}?success=true`,
    cancel_url: `${import.meta.env.SITE_URL}/media/${mediaId}`,
    metadata: { mediaId, price: Math.round(price * 100) },
  });

  return { id: session.id, url: session.url! };
}