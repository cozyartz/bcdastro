import { getSession } from '../../lib/auth';
import type { APIRoute } from 'astro';

interface UpdateThemeRequest {
  userId: string;
  theme: 'dark' | 'light';
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: UpdateThemeRequest;
  try {
    body = await request.json() as UpdateThemeRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { userId, theme } = body;
  if (session.userId !== userId || !['dark', 'light'].includes(theme)) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = locals.D1;
    if (!db) throw new Error('Database connection unavailable');

    await db.prepare('UPDATE users SET theme_preference = ? WHERE id = ?')
      .bind(theme, userId)
      .run();

    // Optional: Cache update in KV
    await env.KV_NAMESPACE?.put(`theme:${userId}`, theme, { expirationTtl: 86400 }); // 24h TTL

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Theme update error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to update theme' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};