import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { local_price, metadata } = await request.json();
    
    if (!local_price || !metadata) {
      return new Response('Missing required fields', { status: 400 });
    }

    const response = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': import.meta.env.CDP_API_KEY_SECRET,
      },
      body: JSON.stringify({ local_price, metadata }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coinbase API error:', errorText);
      return new Response('Failed to create charge', { status: 500 });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create charge error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};