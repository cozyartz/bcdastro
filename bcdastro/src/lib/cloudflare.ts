import { extractVideoThumbnail } from './video.js';

interface UploadResponse {
  id: string;
  preview_url: string;
}

interface CloudflareEnv {
  STREAM_ACCOUNT_ID: string;
  STREAM_API_TOKEN: string;
}

export async function uploadToCloudflareVideo(file: File, env: CloudflareEnv): Promise<UploadResponse> {
  if (!env.STREAM_ACCOUNT_ID || !env.STREAM_API_TOKEN) {
    throw new Error('Missing Cloudflare Stream credentials');
  }

  const formData = new FormData();
  formData.append('file', file, file.name || `video_${Date.now()}.mp4`); // Fallback filename

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30-second timeout
  try {
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
    const videoId = result.uid;
    const previewUrl = await extractVideoThumbnail(file, env.STREAM_ACCOUNT_ID, env.STREAM_API_TOKEN);

    return { id: videoId, preview_url: previewUrl };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Video upload timed out');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function uploadToCloudflareImage(file: File, env: CloudflareEnv): Promise<UploadResponse> {
  if (!env.STREAM_ACCOUNT_ID || !env.STREAM_API_TOKEN) {
    throw new Error('Missing Cloudflare Image credentials');
  }

  const formData = new FormData();
  formData.append('file', file, file.name || `image_${Date.now()}.jpg`); // Fallback filename

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30-second timeout
  try {
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
    const imageId = result.id;
    const previewUrl = `https://imagedelivery.net/${env.STREAM_ACCOUNT_ID}/${imageId}/public`;

    return { id: imageId, preview_url: previewUrl };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Image upload timed out');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}