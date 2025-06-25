import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  is_verified?: boolean;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  total_revenue?: number;
  total_uploads?: number;
  is_admin?: boolean;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'video' | 'image';
  category: string;
  cloudflare_id: string;
  thumbnail_url?: string;
  duration?: string;
  resolution: string;
  file_size: string;
  tags?: string[];
  individual_price: number;
  package_price?: number;
  exclusive_price?: number;
  is_exclusive?: boolean;
  exclusive_buyer_id?: string;
  location?: string;
  property_type?: string;
  property_name?: string;
  upload_date?: string;
  status: 'pending' | 'approved' | 'rejected';
  downloads: number;
  revenue: number;
}

export interface MediaPackage {
  id: string;
  user_id: string;
  title: string;
  description: string;
  property_name: string;
  property_type: string;
  location: string;
  media_assets: string[];
  package_price: number;
  individual_total: number;
  savings_amount: number;
  is_exclusive?: boolean;
  exclusive_price?: number;
  exclusive_buyer_id?: string;
  created_at?: string;
  status: 'active' | 'sold' | 'exclusive';
}

export interface Purchase {
  id: string;
  buyer_email: string;
  buyer_name?: string;
  media_asset_id?: string;
  package_id?: string;
  license_type: 'standard' | 'commercial' | 'exclusive';
  price_paid: number;
  purchase_date?: string;
  download_count: number;
  max_downloads: number;
  last_download?: string;
  payment_intent_id?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
}

// Authentication Service
export const AuthService = {
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },
};

// Media Service
export const MediaService = {
  async getUserMedia(userId: string) {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });
    
    return { data, error };
  },

  async getApprovedMedia() {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('status', 'approved')
      .eq('is_exclusive', false)
      .order('upload_date', { ascending: false });
    
    return { data, error };
  },

  async getMediaById(id: string) {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async createMediaAsset(mediaData: Partial<MediaAsset>) {
    const { data, error } = await supabase
      .from('media_assets')
      .insert([mediaData])
      .select()
      .single();
    
    return { data, error };
  },

  async updateMediaAsset(id: string, updates: Partial<MediaAsset>) {
    const { data, error } = await supabase
      .from('media_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteMediaAsset(id: string) {
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  async searchMedia(query: string, category?: string, type?: string) {
    let queryBuilder = supabase
      .from('media_assets')
      .select('*')
      .eq('status', 'approved')
      .eq('is_exclusive', false);

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder.order('upload_date', { ascending: false });
    
    return { data, error };
  },
};

// Package Service
export const PackageService = {
  async getUserPackages(userId: string) {
    const { data, error } = await supabase
      .from('media_packages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getActivePackages() {
    const { data, error } = await supabase
      .from('media_packages')
      .select('*')
      .eq('status', 'active')
      .eq('is_exclusive', false)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async createPackage(packageData: Partial<MediaPackage>) {
    const { data, error } = await supabase
      .from('media_packages')
      .insert([packageData])
      .select()
      .single();
    
    return { data, error };
  },

  async updatePackage(id: string, updates: Partial<MediaPackage>) {
    const { data, error } = await supabase
      .from('media_packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
};

// Purchase Service
export const PurchaseService = {
  async createPurchase(purchaseData: Partial<Purchase>) {
    const { data, error } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single();
    
    return { data, error };
  },

  async getUserPurchases(userEmail: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        media_assets(*),
        media_packages(*)
      `)
      .eq('buyer_email', userEmail)
      .order('purchase_date', { ascending: false });
    
    return { data, error };
  },

  async getSellerPurchases(userId: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        media_assets!inner(*),
        media_packages!inner(*)
      `)
      .or(`media_assets.user_id.eq.${userId},media_packages.user_id.eq.${userId}`)
      .order('purchase_date', { ascending: false });
    
    return { data, error };
  },

  async updatePurchase(id: string, updates: Partial<Purchase>) {
    const { data, error } = await supabase
      .from('purchases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
};