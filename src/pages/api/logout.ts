import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ message: 'Logged out' }), { headers: { 'Content-Type': 'application/json' } });
};