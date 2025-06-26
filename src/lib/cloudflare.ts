interface CloudflareConfig {
  streamCustomerCode: string;
  imagesAccountHash: string;
}

class CloudflareService {
  private config: CloudflareConfig;

  constructor(config: CloudflareConfig) {
    this.config = config;
  }

  getStreamUrl(videoId: string): string {
    return `https://iframe.videodelivery.net/${videoId}`;
  }

  getImageUrl(imageId: string, variant: string = 'public'): string {
    return `https://imagedelivery.net/${this.config.imagesAccountHash}/${imageId}/${variant}`;
  }

  getThumbnailUrl(videoId: string): string {
    return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;
  }
}

// Initialize Cloudflare service with environment variables
const cloudflareService = new CloudflareService({
  streamCustomerCode: import.meta.env.PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE || '',
  imagesAccountHash: import.meta.env.PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH || '',
});

export { cloudflareService, type CloudflareConfig };