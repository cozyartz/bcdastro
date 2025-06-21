import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const { local_price, metadata } = await request.json();
  const response = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': import.meta.env.CDP_API_KEY_SECRET,
    },
    body: JSON.stringify({ local_price, metadata }),
  });
  return response;
};