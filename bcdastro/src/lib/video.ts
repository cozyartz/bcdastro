import { getSignedUrl } from '@cloudflare/stream';

interface CloudflareStreamEnv {
  streamAccountId: string;
  streamApiToken: string;
}

interface ThumbnailOptions {
  time?: string; // e.g., '2s', '5%'
  format?: 'jpg' | 'png'; // Optional format specification
}

export async function extractVideoThumbnail(file: File, streamAccountId: string, streamApiToken: string, options: ThumbnailOptions = {}): Promise<string> {
  const env: CloudflareStreamEnv = { streamAccountId, streamApiToken };
  if (!env.streamAccountId || !env.streamApiToken) {
    throw new Error('Missing Cloudflare Stream credentials');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30-second timeout
  try {
    // Upload video to Cloudflare Stream
    const formData = new FormData();
    formData.append('file', file, file.name || `video_${Date.now()}.mp4`); // Fallback filename

    const uploadResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.streamAccountId}/stream`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.streamApiToken}` },
      body: formData,
      signal: controller.signal,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`Video upload failed: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }

    const { result } = await uploadResponse.json();
    const videoId = result.uid;

    // Generate signed thumbnail URL
    const thumbnailUrl = await getSignedUrl({
      videoId,
      accountId: env.streamAccountId,
      apiToken: env.streamApiToken,
      options: {
        type: 'thumbnail',
        time: options.time || '2s', // Default to 2 seconds
        format: options.format || 'jpg', // Default to JPG
        transform: { width: 320, height: 180 }, // Optional resize for efficiency
      },
    });

    if (!thumbnailUrl) throw new Error('Failed to generate thumbnail URL');

    return thumbnailUrl;
  } catch (error) {
    console.error('Thumbnail extraction failed:', error instanceof Error ? error.message : 'Unknown error');
    return '/previews/placeholder.jpg'; // Fallback URL
  } finally {
    clearTimeout(timeout);
  }
}