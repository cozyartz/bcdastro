export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/media/download/')) {
      const mediaId = url.pathname.split('/')[3];
      const userId = await import('../lib/auth').verifyJWT(request.headers.get('Authorization'), env.JWT_SECRET);
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      const purchase = await env.DB.prepare('SELECT * FROM purchases WHERE user_id = ? AND media_id = ?')
        .bind(userId, mediaId)
        .first();

      if (!purchase) {
        return new Response('Unauthorized', { status: 403 });
      }

      const media = await env.DB.prepare('SELECT cloudflare_id, type FROM media WHERE id = ?')
        .bind(mediaId)
        .first();

      if (!media) {
        return new Response('Media not found', { status: 404 });
      }

      let signedUrl;
      if (media.type === 'image') {
        signedUrl = await import('../lib/cloudflare').getSignedImageUrl(media.cloudflare_id, env);
      } else if (media.type === 'video') {
        signedUrl = await import('../lib/cloudflare').getSignedStreamUrl(media.cloudflare_id, env);
      }

      return Response.redirect(signedUrl, 302);
    }
    return new Response('Not Found', { status: 404 });
  },
};