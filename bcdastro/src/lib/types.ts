export interface IncomingMedia {
  title: string;
  description: string;
  type: 'video' | 'image';
  fiat_price_cents: number; // Non-negative integer in cents
  accepts_stripe: boolean;
  accepts_crypto: boolean;
  file: File;
  duration?: number; // Optional, in seconds, non-negative
  resolution?: string; // e.g., "1920x1080"
  uploaded_at?: Date;
}

export interface MediaMetadata {
  cloudflare_id: string;
  preview_url: string;
  slug: string;
  creator_wallet: string;
  status: 'published' | 'pending' | 'draft';
  created_at: Date;
  token_gated?: boolean; // Optional, from schema
  token_address?: string;
  chain_id?: string;
  access_agent_id?: string;
}

export interface PurchaseRecord {
  id: string;
  user_id: string;
  media_id: string;
  method: 'stripe' | 'web3';
  stripe_payment_id?: string;
  tx_hash?: string;
  price_paid: number; // Non-negative integer in cents
  created_at: Date;
}

// Utility type for validation
export type ValidatedIncomingMedia = Required<Pick<IncomingMedia, 'title' | 'description' | 'type' | 'fiat_price_cents' | 'accepts_stripe' | 'accepts_crypto' | 'file'>> &
  Partial<Pick<IncomingMedia, 'duration' | 'resolution' | 'uploaded_at'>>;