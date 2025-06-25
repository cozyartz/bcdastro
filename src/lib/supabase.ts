import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  is_verified: boolean;
  subscription_tier: 'free' | 'pro' | 'enterprise';
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
  tags: string[];
  individual_price: number;
  package_price?: number;
  exclusive_price?: number;
  is_exclusive: boolean;
  exclusive_buyer_id?: string;
  location?: string;
  property_type?: string;
  upload_date: string;
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
  media_assets: string[]; // Array of media asset IDs
  package_price: number;
  individual_total: number;
  savings_amount: number;
  is_exclusive: boolean;
  exclusive_price?: number;
  exclusive_buyer_id?: string;
  created_at: string;
  status: 'active' | 'sold' | 'exclusive';
}

export interface Purchase {
  id: string;
  buyer_email: string;
  media_asset_id?: string;
  package_id?: string;
  license_type: 'standard' | 'commercial' | 'exclusive';
  price_paid: number;
  purchase_date: string;
  download_count: number;
  max_downloads: number;
}

export class AuthService {
  static async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    return { data, error };
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async updateProfile(updates: Partial<User>) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    return { data, error };
  }
}

export class MediaService {
  static async uploadMedia(mediaData: Omit<MediaAsset, 'id' | 'upload_date' | 'status' | 'downloads' | 'revenue'>) {
    const { data, error } = await supabase
      .from('media_assets')
      .insert([{
        ...mediaData,
        upload_date: new Date().toISOString(),
        status: 'pending',
        downloads: 0,
        revenue: 0
      }])
      .select()
      .single();
    
    return { data, error };
  }

  static async getUserMedia(userId: string) {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });
    
    return { data, error };
  }

  static async getPublicMedia(category?: string, limit = 20, offset = 0) {
    let query = supabase
      .from('media_assets')
      .select('*')
      .eq('status', 'approved')
      .eq('is_exclusive', false);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { data, error };
  }

  static async createPackage(packageData: Omit<MediaPackage, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('media_packages')
      .insert([{
        ...packageData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  }

  static async getUserPackages(userId: string) {
    const { data, error } = await supabase
      .from('media_packages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }
}

export class PurchaseService {
  static async createPurchase(purchaseData: Omit<Purchase, 'id' | 'purchase_date' | 'download_count'>) {
    const { data, error } = await supabase
      .from('purchases')
      .insert([{
        ...purchaseData,
        purchase_date: new Date().toISOString(),
        download_count: 0
      }])
      .select()
      .single();
    
    return { data, error };
  }

  static async getUserPurchases(userEmail: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('buyer_email', userEmail)
      .order('purchase_date', { ascending: false });
    
    return { data, error };
  }
}