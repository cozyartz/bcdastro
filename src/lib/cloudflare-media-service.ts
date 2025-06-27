// Cloudflare Media Service - Cost-optimized URL generation and service routing
import type { MediaAsset } from './supabase';

export interface CloudflareConfig {
  accountId: string;
  streamCustomerCode: string;
  imagesAccountHash: string;
  r2BucketName: string;
}

export interface CloudflareMedia {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'image';
  category: string;
  cloudflare_id: string;
  thumbnail_url?: string;
  duration?: string;
  resolution: string;
  file_size: string;
  tags: string[];
  price: number;
  url: string;
  thumbnailUrl: string;
  streamUrl?: string; // For HLS playback
}

export class CloudflareMediaService {
  private config: CloudflareConfig;

  constructor() {
    this.config = {
      accountId: import.meta.env.CLOUDFLARE_ACCOUNT_ID || '',
      streamCustomerCode: import.meta.env.CLOUDFLARE_STREAM_CUSTOMER_CODE || '',
      imagesAccountHash: import.meta.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH || '',
      r2BucketName: import.meta.env.CLOUDFLARE_R2_BUCKET_NAME || 'bcdastro-media',
    };
  }

  // Convert Supabase MediaAsset to CloudflareMedia with proper URLs
  transformMediaAsset(asset: MediaAsset): CloudflareMedia {
    const baseMedia: CloudflareMedia = {
      id: asset.id,
      title: asset.title,
      description: asset.description,
      type: asset.type,
      category: asset.category,
      cloudflare_id: asset.cloudflare_id,
      thumbnail_url: asset.thumbnail_url,
      duration: asset.duration,
      resolution: asset.resolution,
      file_size: asset.file_size,
      tags: asset.tags || [],
      price: asset.individual_price,
      url: '',
      thumbnailUrl: '',
    };

    // Generate URLs based on media type and service routing
    if (asset.type === 'video') {
      // Check if stored in Stream vs R2 based on URL pattern or size
      const isStreamVideo = this.isStreamVideo(asset);
      
      if (isStreamVideo) {
        baseMedia.url = this.getStreamPlaybackUrl(asset.cloudflare_id);
        baseMedia.streamUrl = this.getStreamHLSUrl(asset.cloudflare_id);
        baseMedia.thumbnailUrl = this.getStreamThumbnailUrl(asset.cloudflare_id);
      } else {
        baseMedia.url = this.getR2VideoUrl(asset.cloudflare_id);
        baseMedia.thumbnailUrl = asset.thumbnail_url || this.getR2ThumbnailUrl(asset.cloudflare_id);
      }
    } else {
      // Images - use Cloudflare Images for optimization
      baseMedia.url = this.getImageUrl(asset.cloudflare_id, 'public');
      baseMedia.thumbnailUrl = this.getImageUrl(asset.cloudflare_id, 'thumbnail');
    }

    return baseMedia;
  }

  // Determine if video is stored in Stream (<=200MB) or R2 (>200MB)
  private isStreamVideo(asset: MediaAsset): boolean {
    // Parse file size to determine service
    const sizeStr = asset.file_size.toLowerCase();
    const sizeMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(mb|gb)/);
    
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2];
      const sizeInMB = unit === 'gb' ? size * 1024 : size;
      return sizeInMB <= 200; // Stream limit
    }
    
    // Default to Stream for unknown sizes
    return true;
  }

  // Cloudflare Stream URLs
  private getStreamPlaybackUrl(videoId: string): string {
    return `https://customer-${this.config.streamCustomerCode}.cloudflarestream.com/${videoId}/iframe`;
  }

  private getStreamHLSUrl(videoId: string): string {
    return `https://customer-${this.config.streamCustomerCode}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  }

  private getStreamThumbnailUrl(videoId: string): string {
    return `https://customer-${this.config.streamCustomerCode}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
  }

  // Cloudflare R2 URLs
  private getR2VideoUrl(videoId: string): string {
    return `https://pub-${this.config.r2BucketName}.r2.dev/${videoId}`;
  }

  private getR2ThumbnailUrl(videoId: string): string {
    return `https://pub-${this.config.r2BucketName}.r2.dev/${videoId}-thumbnail.jpg`;
  }

  // Cloudflare Images URLs
  private getImageUrl(imageId: string, variant: string = 'public'): string {
    return `https://imagedelivery.net/${this.config.imagesAccountHash}/${imageId}/${variant}`;
  }

  // Get optimized image variants
  getImageVariants(imageId: string): Array<{ id: string; url: string }> {
    return [
      { id: 'thumbnail', url: this.getImageUrl(imageId, 'thumbnail') },
      { id: 'medium', url: this.getImageUrl(imageId, 'medium') },
      { id: 'large', url: this.getImageUrl(imageId, 'large') },
      { id: 'public', url: this.getImageUrl(imageId, 'public') },
    ];
  }

  // Transform array of MediaAssets
  transformMediaAssets(assets: MediaAsset[]): CloudflareMedia[] {
    return assets.map(asset => this.transformMediaAsset(asset));
  }

  // Get categories from media assets
  getCategories(media: CloudflareMedia[]): string[] {
    const categories = [...new Set(media.map(item => item.category))];
    return categories.sort();
  }

  // Search and filter media
  searchMedia(
    media: CloudflareMedia[], 
    query?: string, 
    category?: string, 
    type?: 'video' | 'image'
  ): CloudflareMedia[] {
    let filtered = media;

    if (category && category !== 'all') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (type) {
      filtered = filtered.filter(item => item.type === type);
    }

    if (query) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        item.category.toLowerCase().includes(searchQuery)
      );
    }

    return filtered;
  }
}

// Singleton instance
export const cloudflareMediaService = new CloudflareMediaService();