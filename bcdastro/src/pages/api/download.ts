import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { uploadToCloudflareImage, uploadToCloudflareVideo } from '../../lib/cloudflare';

// Custom Locals type for Cloudflare
interface CloudflareLocals {
  D1: any; // Replace with D1 type if available
  env: {
    STREAM_ACCOUNT_ID: string;
    STREAM_API_TOKEN: string;
    SITE_URL: string;
  };
}

export const get: APIRoute = async ({ params, locals }: { params: { id?: string }; locals: CloudflareLocals }) => {
  const mediaId = params.id;
  if (!mediaId || typeof mediaId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid media ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const session = await getSession(Astro.request, locals.env);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = locals.D1;
    if (!db) throw new Error('Cloudflare D1 connection unavailable');

    const purchase = await db.prepare('SELECT 1 FROM purchases WHERE user_id = ? AND media_id = ?')
      .bind(session.userId, mediaId)
      .first();
    if (!purchase) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const media = await db.prepare('SELECT cloudflare_id, type FROM media WHERE id = ?')
      .bind(mediaId)
      .first();
    if (!media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let signedUrl;
    if (media.type === 'image') {
      signedUrl = (await uploadToCloudflareImage({ file: new File([], mediaId), env: locals.env } as any)).preview_url;
    } else if (media.type === 'video') {
      signedUrl = (await uploadToCloudflareVideo({ file: new File([], mediaId), env: locals.env } as any)).preview_url;
    } else {
      throw new Error('Unsupported media type');
    }

    if (!signedUrl) throw new Error('Failed to generate signed URL');
    return Response.redirect(signedUrl, 302);
  } catch (error) {
    console.error('Download error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: error.message || 'Download failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};