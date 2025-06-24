import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';

export const POST: APIRoute = async ({ request, locals, env }) => {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No active session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Invalidate session (e.g., clear token from client-side storage or blacklist)
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      await env.KV_NAMESPACE?.put(`blacklist:${token}`, 'true', { expirationTtl: 86400 }); // 24h blacklist
    }

    // Optional: Update user session in DB (if tracking)
    await locals.DB?.prepare('UPDATE users SET last_logout = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(session.userId)
      .run()
      .catch(console.error);

    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Prevent caching of logout response
        'Set-Cookie': 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict', // Clear cookie
      },
    });
  } catch (error) {
    console.error('Logout error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to log out' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};