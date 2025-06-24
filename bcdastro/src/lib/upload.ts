import { IncomingMedia, ValidatedIncomingMedia } from './types.js';
import { extractVideoThumbnail } from './video.js';
import { createPublicClient, http } from 'viem';
import { base } from '@coinbase/onchainkit';

interface CloudflareEnv {
  STREAM_ACCOUNT_ID: string;
  STREAM_API_TOKEN: string;
}

export async function parseFormData(formData: FormData): Promise<ValidatedIncomingMedia> {
  const title = formData.get('title')?.toString().trim();
  const description = formData.get('description')?.toString();
  const type = formData.get('type')?.toString() as 'video' | 'image' | null;
  const fiatPrice = formData.get('fiat_price')?.toString();
  const acceptsStripe = formData.get('accepts_stripe') === 'on';
  const acceptsCrypto = formData.get('accepts_crypto') === 'on';
  const file = formData.get('file') as File | null;

  if (!title || title.length === 0) throw new Error('Title is required');
  if (!description || description.length === 0) throw new Error('Description is required');
  if (!type || !['video', 'image'].includes(type)) throw new Error('Invalid media type');
  if (!fiatPrice || isNaN(parseFloat(fiatPrice)) || parseFloat(fiatPrice) <= 0) {
    throw new Error('Invalid price (must be a positive number)');
  }
  if (!file || !(file instanceof File) || file.size === 0) throw new Error('Valid file is required');

  return {
    title,
    description,
    type,
    fiat_price_cents: Math.round(parseFloat(fiatPrice) * 100),
    accepts_stripe: acceptsStripe,
    accepts_crypto: acceptsCrypto,
    file,
  } as ValidatedIncomingMedia;
}

export async function uploadToCloudflare(media: IncomingMedia, env: CloudflareEnv): Promise<{ id: string; preview: string }> {
  if (!env.STREAM_ACCOUNT_ID || !env.STREAM_API_TOKEN) {
    throw new Error('Missing Cloudflare Stream credentials');
  }

  const formData = new FormData();
  formData.append('file', media.file, media.file.name || `${media.type}_${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30-second timeout
  try {
    let url = '';
    if (media.type === 'video') {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.STREAM_ACCOUNT_ID}/stream`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.STREAM_API_TOKEN}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Video upload failed: ${error.errors?.[0]?.message || 'Unknown error'}`);
      }

      const { result } = await response.json();
      url = await extractVideoThumbnail(media.file, env.STREAM_ACCOUNT_ID, env.STREAM_API_TOKEN);
    } else if (media.type === 'image') {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.STREAM_ACCOUNT_ID}/images/v1`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.STREAM_API_TOKEN}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Image upload failed: ${error.errors?.[0]?.message || 'Unknown error'}`);
      }

      const { result } = await response.json();
      url = `https://imagedelivery.net/${env.STREAM_ACCOUNT_ID}/${result.id}/public`;
    } else {
      throw new Error('Unsupported media type');
    }

    return { id: media.file.name || `${media.type}_${Date.now()}`, preview: url };
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}