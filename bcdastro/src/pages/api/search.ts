import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export const GET: APIRoute = async ({ locals, url }) => {
  const session = await getSession(Astro.request, locals);
  const searchQuery = url.searchParams.get('q')?.trim() || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10))); // Cap at 50
  const offset = (page - 1) * limit;

  if (!searchQuery && !session) {
    return new Response(JSON.stringify({ error: 'Authentication or search query required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = locals.D1;
    if (!db) throw new Error('Cloudflare D1 connection unavailable');

    const query = `
      SELECT id, title, preview_url, slug 
      FROM media 
      WHERE slug IS NOT NULL 
      AND status = 'published' 
      AND for_sale = true 
      ${searchQuery ? 'AND title LIKE ?' : ''}
      LIMIT ? OFFSET ?
    `;
    const params = searchQuery ? [`%${searchQuery}%`, limit, offset] : [limit, offset];

    const mediaResult = await db.prepare(query).bind(...params).all();
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total 
      FROM media 
      WHERE slug IS NOT NULL 
      AND status = ? 
      AND for_sale = ? 
      ${searchQuery ? 'AND title LIKE ?' : ''}
    `).bind('published', true, ...(searchQuery ? [`%${searchQuery}%`] : [])).first();

    const pagination: Pagination = {
      page,
      limit,
      total: totalResult.total || 0,
    };

    return new Response(JSON.stringify({
      results: mediaResult.results,
      pagination,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
        'X-Total-Count': pagination.total.toString(),
      },
    });
  } catch (error) {
    console.error('Media search error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to search media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};