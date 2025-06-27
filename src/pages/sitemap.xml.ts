import type { APIRoute } from 'astro';

const SITE_URL = 'https://battlecreekdrone.com';

export const GET: APIRoute = async () => {
  const staticPages = [
    '',
    '/services',
    '/gallery',
    '/portfolio', 
    '/contact',
    '/about',
    '/bcdastro',
  ];

  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((page) => {
      return `<url>
    <loc>${SITE_URL}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('')}
</urlset>`;

  return new Response(sitemapXML, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};