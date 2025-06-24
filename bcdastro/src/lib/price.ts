import { cache } from 'react'; // For client-side caching (optional with Astro)
import { env } from 'cloudflare:workers'; // For Workers environment

export async function getETHPrice(): Promise<number> {
  const cacheKey = 'ethPrice';
  const cachedPrice = await env.KV_NAMESPACE?.get(cacheKey); // Use KV if configured
  if (cachedPrice) return parseFloat(cachedPrice);

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
      headers: { 'Cache-Control': 'max-age=300' }, // Cache for 5 minutes
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const price = data.ethereum?.usd;
    if (!price || isNaN(price)) throw new Error('Invalid ETH price data');

    await env.KV_NAMESPACE?.put(cacheKey, price.toString(), { expirationTtl: 300 }); // 5-minute TTL
    return price;
  } catch (error) {
    console.error('ETH price fetch failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Unable to retrieve ETH price');
  }
}

// Cached version for client-side (optional)
export const getCachedETHPrice = cache(async () => await getETHPrice());