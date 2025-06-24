import type { APIRoute } from 'astro';

interface PriceResponse {
  price: number;
  cached?: boolean;
}

export const get: APIRoute = async ({ params, locals, env }) => {
  if (!params.id || typeof params.id !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid media ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `price:${params.id}`;
  const cachedPrice = await env.KV_NAMESPACE?.get(cacheKey); // Check KV cache if configured
  if (cachedPrice) {
    return new Response(JSON.stringify({ price: parseInt(cachedPrice), cached: true } as PriceResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const db = locals.DB;
    if (!db) throw new Error('Database connection unavailable');

    const row = await db.prepare('SELECT fiat_price_cents FROM media WHERE id = ?')
      .bind(params.id)
      .first();

    if (!row) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const price = row.fiat_price_cents || 0;
    await env.KV_NAMESPACE?.put(cacheKey, price.toString(), { expirationTtl: 3600 }); // Cache for 1 hour

    return new Response(JSON.stringify({ price } as PriceResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('Price fetch error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to retrieve price' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};