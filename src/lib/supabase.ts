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
  is_admin?: boolean;
  is_verified?: boolean;
  subscription_tier: 'pro' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  subscription_start?: string;
  subscription_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  monthly_fee: number;
  fiat_commission_rate: number;
  crypto_commission_rate: number;
  total_revenue: number;
  total_uploads: number;
  wallet_address?: string;
  wallet_type?: string;
  wallet_connected: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ClientProject {
  id: string;
  user_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  project_name: string;
  project_description?: string;
  property_type: string;
  property_address?: string;
  shoot_date?: string;
  delivery_deadline?: string;
  total_budget?: number;
  status: 'planning' | 'in_progress' | 'review' | 'delivered' | 'completed';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  client_project_id?: string;
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
  exclusive_buyer_email?: string;
  location?: string;
  property_type?: string;
  property_name?: string;
  upload_date?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  downloads: number;
  revenue: number;
  created_at: string;
  updated_at?: string;
}

export interface MediaPackage {
  id: string;
  user_id: string;
  client_project_id: string;
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
  exclusive_buyer_email?: string;
  status: 'active' | 'sold' | 'exclusive';
  created_at: string;
  updated_at?: string;
}

export interface Purchase {
  id: string;
  buyer_email: string;
  buyer_name?: string;
  buyer_company?: string;
  media_asset_id?: string;
  package_id?: string;
  client_project_id?: string;
  license_type: 'standard' | 'commercial' | 'exclusive';
  price_paid: number;
  platform_fee: number;
  creator_payout: number;
  purchase_date: string;
  download_count: number;
  max_downloads: number;
  last_download?: string;
  payment_intent_id?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'stripe' | 'crypto';
  crypto_charge_id?: string;
  crypto_currency?: string;
  crypto_amount?: string;
  crypto_wallet_address?: string;
  crypto_transaction_hash?: string;
  crypto_confirmation_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface Commission {
  id: string;
  user_id: string;
  purchase_id: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  platform_revenue: number;
  creator_payout: number;
  status: 'pending' | 'paid' | 'hold';
  payout_date?: string;
  created_at: string;
}

export interface SubscriptionBilling {
  id: string;
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  monthly_fee: number;
  commission_earned: number;
  total_sales: number;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  stripe_invoice_id?: string;
  payment_date?: string;
  created_at: string;
}

export interface ProjectMediaStats {
  id: string;
  client_project_id: string;
  total_media_count: number;
  approved_media_count: number;
  pending_media_count: number;
  total_revenue: number;
  total_downloads: number;
  average_price: number;
  updated_at: string;
}

export interface CryptoPayment {
  id: string;
  purchase_id: string;
  charge_id: string;
  currency: string;
  amount: string;
  wallet_address: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  transaction_hash?: string;
  confirmation_count: number;
  created_at: string;
  confirmed_at?: string;
  expires_at: string;
  metadata?: Record<string, any>;
}

// Authentication Service
export const AuthService = {
  async signUp(email: string, password: string, fullName?: string, pilotCertNumber?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
          full_name: fullName,
          pilot_cert_number: pilotCertNumber,
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

  async signInWithGitHub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { data, error };
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { data, error };
  },

  async resendVerificationEmail(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    return { data, error };
  },

  async verifyOTP(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { data, error };
  },

  async connectWallet(walletAddress: string, walletType: string, userId?: string) {
    if (!userId) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.id;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        wallet_address: walletAddress.toLowerCase(),
        wallet_type: walletType,
        wallet_connected: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  async disconnectWallet(userId?: string) {
    if (!userId) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.id;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        wallet_address: null,
        wallet_type: null,
        wallet_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  async signInWithWallet(walletAddress: string, signature: string, message: string) {
    try {
      // In a real implementation, you'd verify the signature here
      // For now, we'll create a simplified wallet-based auth
      const response = await fetch('/api/wallet-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message
        }),
      });

      if (!response.ok) {
        throw new Error(`Wallet auth failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
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

  // Alias for createMediaAsset for backward compatibility
  async uploadMedia(mediaData: Partial<MediaAsset>) {
    return this.createMediaAsset(mediaData);
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

// Client Project Service
export const ClientProjectService = {
  async getUserProjects(userId: string) {
    const { data, error } = await supabase
      .from('client_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async createProject(projectData: Partial<ClientProject>) {
    const { data, error } = await supabase
      .from('client_projects')
      .insert([projectData])
      .select()
      .single();
    
    return { data, error };
  },

  async updateProject(id: string, updates: Partial<ClientProject>) {
    const { data, error } = await supabase
      .from('client_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  async getProjectById(id: string) {
    const { data, error } = await supabase
      .from('client_projects')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async getProjectMedia(projectId: string) {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('client_project_id', projectId)
      .order('upload_date', { ascending: false });
    
    return { data, error };
  },

  async getProjectStats(projectId: string) {
    const { data, error } = await supabase
      .from('project_media_stats')
      .select('*')
      .eq('client_project_id', projectId)
      .single();
    
    return { data, error };
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('client_projects')
      .delete()
      .eq('id', id);
    
    return { error };
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

// Crypto Payment Service
export const CryptoPaymentService = {
  async createCryptoPayment(paymentData: Partial<CryptoPayment>) {
    const { data, error } = await supabase
      .from('crypto_payments')
      .insert([paymentData])
      .select()
      .single();
    
    return { data, error };
  },

  async getCryptoPaymentByChargeId(chargeId: string) {
    const { data, error } = await supabase
      .from('crypto_payments')
      .select('*')
      .eq('charge_id', chargeId)
      .single();
    
    return { data, error };
  },

  async updateCryptoPaymentStatus(
    chargeId: string, 
    status: 'pending' | 'confirmed' | 'failed' | 'expired',
    transactionHash?: string,
    confirmationCount?: number
  ) {
    const updates: any = { status };
    
    if (transactionHash) updates.transaction_hash = transactionHash;
    if (confirmationCount !== undefined) updates.confirmation_count = confirmationCount;
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('crypto_payments')
      .update(updates)
      .eq('charge_id', chargeId)
      .select()
      .single();
    
    return { data, error };
  },

  async getCryptoPaymentsByPurchaseId(purchaseId: string) {
    const { data, error } = await supabase
      .from('crypto_payments')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getExpiredCryptoPayments() {
    const { data, error } = await supabase
      .from('crypto_payments')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());
    
    return { data, error };
  },

  async cleanupExpiredPayments() {
    const { error } = await supabase.rpc('cleanup_expired_crypto_payments');
    return { error };
  },
};

// Commission Service
export const CommissionService = {
  async calculateCommission(
    saleAmount: number, 
    paymentMethod: 'stripe' | 'crypto',
    userFiatRate: number = 0.15,
    userCryptoRate: number = 0.10
  ) {
    const { data, error } = await supabase.rpc('calculate_commission', {
      sale_amount: saleAmount,
      payment_method: paymentMethod,
      user_fiat_rate: userFiatRate,
      user_crypto_rate: userCryptoRate
    });
    
    return { data, error };
  },

  async createCommission(commissionData: Partial<Commission>) {
    const { data, error } = await supabase
      .from('commissions')
      .insert([commissionData])
      .select()
      .single();
    
    return { data, error };
  },

  async getUserCommissions(userId: string) {
    const { data, error } = await supabase
      .from('commissions')
      .select(`
        *,
        purchases(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async updateCommissionStatus(id: string, status: 'pending' | 'paid' | 'hold', payoutDate?: string) {
    const updates: any = { status };
    if (payoutDate) updates.payout_date = payoutDate;

    const { data, error } = await supabase
      .from('commissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  async getTotalCommissions(userId: string) {
    const { data, error } = await supabase
      .from('commissions')
      .select('commission_amount, creator_payout, status')
      .eq('user_id', userId);
    
    if (error) return { data: null, error };

    const totalCommissions = data.reduce((sum, comm) => sum + Number(comm.commission_amount), 0);
    const totalPayouts = data.reduce((sum, comm) => sum + Number(comm.creator_payout), 0);
    const pendingPayouts = data
      .filter(comm => comm.status === 'pending')
      .reduce((sum, comm) => sum + Number(comm.creator_payout), 0);

    return {
      data: {
        totalCommissions,
        totalPayouts,
        pendingPayouts
      },
      error: null
    };
  },
};

// Subscription Service
export const SubscriptionService = {
  async createBillingRecord(billingData: Partial<SubscriptionBilling>) {
    const { data, error } = await supabase
      .from('subscription_billing')
      .insert([billingData])
      .select()
      .single();
    
    return { data, error };
  },

  async getUserBillingHistory(userId: string) {
    const { data, error } = await supabase
      .from('subscription_billing')
      .select('*')
      .eq('user_id', userId)
      .order('billing_period_start', { ascending: false });
    
    return { data, error };
  },

  async updateSubscriptionTier(
    userId: string, 
    tier: 'pro' | 'enterprise', 
    monthlyFee: number, 
    fiatCommissionRate: number,
    cryptoCommissionRate: number
  ) {
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        monthly_fee: monthlyFee,
        fiat_commission_rate: fiatCommissionRate,
        crypto_commission_rate: cryptoCommissionRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },
};

// Pilot Certificate Validation Service
export const PilotCertService = {
  async validateCertificate(certificationNumber: string, userEmail: string) {
    try {
      const response = await fetch('/api/verify-pilot-cert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificationNumber,
          userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },

  async getCachedValidation(certificationNumber: string) {
    try {
      const response = await fetch(`/api/verify-pilot-cert?cert=${encodeURIComponent(certificationNumber)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return { data: null, error: null };
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },
};