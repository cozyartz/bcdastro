import type { APIRoute } from 'astro';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${import.meta.env.STREAM_ACCOUNT_ID || import.meta.env.PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: import.meta.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const { key, contentType, metadata } = await request.json();

    if (!key || !contentType) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: key, contentType' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = [
      // Video types
      'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm',
      'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
      // Image types
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp',
      'image/tiff', 'image/webp', 'image/svg+xml'
    ];

    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return new Response(JSON.stringify({ 
        error: 'Unsupported content type' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create presigned URL for R2 upload
    const bucketName = import.meta.env.CLOUDFLARE_R2_BUCKET || 'bcd-media';
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: metadata || {},
      // Add content length limits if needed
      // ContentLength: maxSize,
    });

    // Generate presigned URL valid for 30 minutes
    const uploadURL = await getSignedUrl(r2Client, command, { 
      expiresIn: 30 * 60 // 30 minutes
    });

    // Return the upload URL and metadata
    return new Response(JSON.stringify({
      success: true,
      uploadURL,
      key,
      bucketName,
      publicURL: `https://pub-${bucketName}.r2.dev/${key}`,
      expiresIn: 30 * 60,
      metadata: {
        contentType,
        createdAt: new Date().toISOString(),
        ...metadata
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('R2 upload URL generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Handle CORS preflight requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};