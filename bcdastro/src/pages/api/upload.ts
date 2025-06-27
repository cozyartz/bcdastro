import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { parseFormData, uploadToCloudflare } from '../../lib/upload';
import { generateSlug } from '../../lib/utils';
import { extractVideoThumbnail } from '../../lib/video';
import { createPublicClient, http } from 'viem';
import { base } from '@coinbase/onchainkit';
import { IncomingMedia } from '../../lib/types';

export const POST: APIRoute = async ({ request, locals, env }) => {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let formData;
  try {
    formData = await request.formData();
    if (formData.get('file')?.size > 100 * 1024 * 1024) { // 100MB limit
      return new Response(JSON.stringify({ error: 'File size exceeds 100MB limit' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let media: IncomingMedia;
  try {
    media = await parseFormData(formData);
    if (!['image/jpeg', 'image/png', 'video/mp4'].includes(media.file.type)) {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid media data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let cloudflare;
  try {
    cloudflare = await uploadToCloudflare(media.file, media.type, env);
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = generateSlug(media.title);

  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  let ethPrice;
  try {
    ethPrice = await client.getEthPrice({ amount: BigInt(media.fiat_price_cents / 100) });
  } catch (error) {
    console.warn('ETH price fetch failed, using 0:', error);
    ethPrice = BigInt(0); // Fallback
  }

  const db = locals.D1;
  try {
    await db.prepare(`
      INSERT INTO media (id, title, description, type, cloudflare_id, preview_url, fiat_price_cents, price_wei, accepts_stripe, accepts_crypto, slug, creator_wallet, for_sale, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      crypto.randomUUID(),
      media.title,
      media.description,
      media.type,
      cloudflare.id,
      cloudflare.preview,
      media.fiat_price_cents,
      ethPrice.toString(),
      media.accepts_stripe,
      media.accepts_crypto,
      slug,
      session.userId,
      true
    ).run();
  } catch (error) {
    return new Response(JSON.stringify({ error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, slug, previewUrl: cloudflare.preview }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};