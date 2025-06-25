<<<<<<< HEAD
interface CloudflareConfig {
  streamCustomerCode: string;
  imagesAccountHash: string;
}

class CloudflareService {
=======
export interface CloudflareMedia {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'image';
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  resolution?: string;
  fileSize?: string;
  uploadDate: string;
  category: string;
  price: number;
  tags: string[];
}

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  streamBaseUrl: string;
  imagesBaseUrl: string;
}

// Mock data for development - replace with actual Cloudflare API calls
export const mockGalleryData: CloudflareMedia[] = [
  {
    id: 'cf-video-001',
    title: 'Downtown Battle Creek Aerial Tour',
    description: 'Comprehensive 4K aerial footage showcasing the heart of Battle Creek\'s business district during golden hour',
    type: 'video',
    url: 'https://customer-streams.cloudflarestream.com/your-account/video-001/manifest/video.m3u8',
    thumbnailUrl: 'https://images.pexels.com/photos/442587/pexels-photo-442587.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: '2:45',
    resolution: '4K UHD',
    fileSize: '1.2 GB',
    uploadDate: '2024-01-15',
    category: 'Urban',
    price: 149.99,
    tags: ['downtown', 'business-district', 'golden-hour', '4k']
  },
  {
    id: 'cf-image-001',
    title: 'Agricultural Landscape Collection',
    description: 'High-resolution aerial photography capturing the geometric beauty of Michigan farmland and crop patterns',
    type: 'image',
    url: 'https://imagedelivery.net/your-account/image-001/public',
    thumbnailUrl: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=600',
    resolution: '8K RAW',
    fileSize: '45 MB',
    uploadDate: '2024-01-12',
    category: 'Agricultural',
    price: 89.99,
    tags: ['agriculture', 'farmland', 'patterns', 'raw']
  },
  {
    id: 'cf-video-002',
    title: 'Sunset Over Kalamazoo River',
    description: 'Breathtaking cinematic footage of sunset reflections over the Kalamazoo River with dynamic camera movements',
    type: 'video',
    url: 'https://customer-streams.cloudflarestream.com/your-account/video-002/manifest/video.m3u8',
    thumbnailUrl: 'https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: '3:20',
    resolution: '4K UHD',
    fileSize: '1.8 GB',
    uploadDate: '2024-01-10',
    category: 'Nature',
    price: 199.99,
    tags: ['sunset', 'river', 'cinematic', 'water']
  },
  {
    id: 'cf-image-002',
    title: 'Industrial Complex Overview',
    description: 'Detailed aerial documentation of manufacturing facilities and industrial infrastructure',
    type: 'image',
    url: 'https://imagedelivery.net/your-account/image-002/public',
    thumbnailUrl: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=600',
    resolution: '6K RAW',
    fileSize: '32 MB',
    uploadDate: '2024-01-08',
    category: 'Industrial',
    price: 129.99,
    tags: ['industrial', 'manufacturing', 'infrastructure', 'commercial']
  },
  {
    id: 'cf-video-003',
    title: 'Real Estate Showcase - Luxury Property',
    description: 'Professional real estate videography featuring smooth cinematic movements and multiple angles',
    type: 'video',
    url: 'https://customer-streams.cloudflarestream.com/your-account/video-003/manifest/video.m3u8',
    thumbnailUrl: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=600',
    duration: '1:55',
    resolution: '4K UHD',
    fileSize: '950 MB',
    uploadDate: '2024-01-05',
    category: 'Real Estate',
    price: 179.99,
    tags: ['real-estate', 'luxury', 'property', 'showcase']
  },
  {
    id: 'cf-image-003',
    title: 'Construction Progress Documentation',
    description: 'Time-series aerial photography documenting construction phases and site development',
    type: 'image',
    url: 'https://imagedelivery.net/your-account/image-003/public',
    thumbnailUrl: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=600',
    resolution: '5K RAW',
    fileSize: '28 MB',
    uploadDate: '2024-01-03',
    category: 'Construction',
    price: 99.99,
    tags: ['construction', 'progress', 'development', 'documentation']
  }
];

export class CloudflareMediaService {
>>>>>>> d3882f7 (Integrate Cloudflare storage with professional gallery)
  private config: CloudflareConfig;

  constructor(config: CloudflareConfig) {
    this.config = config;
  }

<<<<<<< HEAD
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
=======
  async getGalleryItems(category?: string): Promise<CloudflareMedia[]> {
    // In production, this would make actual API calls to Cloudflare
    // For now, return mock data filtered by category if provided
    let items = mockGalleryData;
    
    if (category) {
      items = items.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    return items.sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  async getMediaById(id: string): Promise<CloudflareMedia | null> {
    return mockGalleryData.find(item => item.id === id) || null;
  }

  async getCategories(): Promise<string[]> {
    const categories = [...new Set(mockGalleryData.map(item => item.category))];
    return categories.sort();
  }

  getStreamUrl(videoId: string): string {
    return `${this.config.streamBaseUrl}/${videoId}/manifest/video.m3u8`;
  }

  getImageUrl(imageId: string, variant: string = 'public'): string {
    return `${this.config.imagesBaseUrl}/${imageId}/${variant}`;
  }
}

// Initialize service with your Cloudflare configuration
export const cloudflareService = new CloudflareMediaService({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'your-account-id',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || 'your-api-token',
  streamBaseUrl: 'https://customer-streams.cloudflarestream.com/your-account',
  imagesBaseUrl: 'https://imagedelivery.net/your-account'
});
>>>>>>> d3882f7 (Integrate Cloudflare storage with professional gallery)
