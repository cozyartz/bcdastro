import type { APIRoute } from 'astro';
import { getETHPrice } from '../../../bcdastro/src/lib/pricing';

export const GET: APIRoute = async ({ env }) => {
  try {
    const price = await getETHPrice();
    return new Response(JSON.stringify({ eth_usd: price }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    console.error('ETH price fetch error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to retrieve ETH price' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};