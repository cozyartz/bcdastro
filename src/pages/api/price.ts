import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const mediaId = params.id;
  if (!mediaId) {
    return new Response('Missing media ID', { status: 400 });
  }

  const cacheKey = `price_${mediaId}`;
  const cachedPrice = await locals.KV.get(cacheKey);

  if (cachedPrice) {
    return new Response(cachedPrice, { headers: { 'Content-Type': 'application/json' } });
  }

  const media = await locals.D1.prepare('SELECT metadata, type FROM media WHERE id = ?')
    .bind(mediaId)
    .first();

  if (!media) {
    return new Response('Media not found', { status: 404 });
  }

  const metadata = JSON.parse(media.metadata);
  let price = 0;

  // Dynamic pricing
  if (media.type === 'image') {
    price = 5000 + (metadata.megapixels || 0) * 1000; // $50 + $10/MP
  } else if (media.type === 'video') {
    price = 10000 + (metadata.duration || 0) * 5000; // $100 + $50/min
    if (metadata.resolution === '4K') price += 10000; // +$100 for 4K
  }
  if (metadata.license === 'commercial') price += 20000; // +$200

  await locals.KV.put(cacheKey, JSON.stringify({ price }), { expirationTtl: 3600 });
  return new Response(JSON.stringify({ price }), { headers: { 'Content-Type': 'application/json' } });
};