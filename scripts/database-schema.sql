-- Updated database schema for BCDAstro with new pricing model

-- Users table with subscription tiers
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT NOT NULL DEFAULT 'pro' CHECK (subscription_tier IN ('pro', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid')),
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  monthly_fee DECIMAL(10,2) DEFAULT 10.00,
  fiat_commission_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% commission for fiat payments
  crypto_commission_rate DECIMAL(5,4) DEFAULT 0.10, -- 10% commission for crypto payments
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_uploads INTEGER DEFAULT 0,
  -- Web3 wallet information
  wallet_address TEXT,
  wallet_type TEXT, -- 'metamask', 'walletconnect', 'coinbase', etc.
  wallet_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client projects table for managing bulk uploads per client
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  project_name TEXT NOT NULL,
  project_description TEXT,
  property_type TEXT NOT NULL, -- 'golf_course', 'real_estate', 'commercial', 'industrial', etc.
  property_address TEXT,
  shoot_date DATE,
  delivery_deadline DATE,
  total_budget DECIMAL(10,2),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'delivered', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media assets table (updated)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'image')),  
  category TEXT NOT NULL,
  cloudflare_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT,
  resolution TEXT NOT NULL,
  file_size TEXT NOT NULL,
  tags TEXT[],
  -- Pricing tiers
  individual_price DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  package_price DECIMAL(10,2),
  exclusive_price DECIMAL(10,2),
  -- Exclusivity
  is_exclusive BOOLEAN DEFAULT FALSE,
  exclusive_buyer_id UUID,
  exclusive_buyer_email TEXT,
  -- Location and property info
  location TEXT,
  property_type TEXT,
  property_name TEXT,
  -- Upload and approval
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  -- Analytics
  downloads INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media packages table (updated)
CREATE TABLE IF NOT EXISTS media_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_name TEXT NOT NULL,
  property_type TEXT NOT NULL,
  location TEXT NOT NULL,
  media_assets UUID[] NOT NULL,
  package_price DECIMAL(10,2) NOT NULL,
  individual_total DECIMAL(10,2) NOT NULL,
  savings_amount DECIMAL(10,2) NOT NULL,
  is_exclusive BOOLEAN DEFAULT FALSE,
  exclusive_price DECIMAL(10,2),
  exclusive_buyer_id UUID,
  exclusive_buyer_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'exclusive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases table (updated)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_company TEXT,
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  package_id UUID REFERENCES media_packages(id) ON DELETE SET NULL,
  client_project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('standard', 'commercial', 'exclusive')),
  price_paid DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL, -- Our commission
  creator_payout DECIMAL(10,2) NOT NULL, -- What creator receives
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 999,
  last_download TIMESTAMPTZ,
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'crypto')),
  -- Crypto payment fields
  crypto_charge_id TEXT,
  crypto_currency TEXT,
  crypto_amount TEXT,
  crypto_wallet_address TEXT,
  crypto_transaction_hash TEXT,
  crypto_confirmation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission tracking table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  sale_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  platform_revenue DECIMAL(10,2) NOT NULL,
  creator_payout DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'hold')),
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription billing table
CREATE TABLE IF NOT EXISTS subscription_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
  stripe_invoice_id TEXT,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client project media tracking
CREATE TABLE IF NOT EXISTS project_media_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
  total_media_count INTEGER DEFAULT 0,
  approved_media_count INTEGER DEFAULT 0,
  pending_media_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  average_price DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_client_project_id ON media_assets(client_project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_assets_upload_date ON media_assets(upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_client_projects_user_id ON client_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON client_projects(status);

CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status);

CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_projects_updated_at 
  BEFORE UPDATE ON client_projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_assets_updated_at 
  BEFORE UPDATE ON media_assets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_packages_updated_at 
  BEFORE UPDATE ON media_packages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id OR is_admin = true);

CREATE POLICY "Users can update their own profile" ON users  
  FOR UPDATE USING (auth.uid() = id);

-- Policies for client projects
CREATE POLICY "Users can view their own projects" ON client_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON client_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON client_projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for media assets
CREATE POLICY "Users can view their own media" ON media_assets
  FOR SELECT USING (auth.uid() = user_id OR status = 'approved');

CREATE POLICY "Users can create their own media" ON media_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON media_assets
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate commission based on payment method
CREATE OR REPLACE FUNCTION calculate_commission(
  sale_amount DECIMAL(10,2),
  payment_method TEXT,
  user_fiat_rate DECIMAL(5,4) DEFAULT 0.15,
  user_crypto_rate DECIMAL(5,4) DEFAULT 0.10
)
RETURNS TABLE(
  commission_amount DECIMAL(10,2),
  platform_revenue DECIMAL(10,2),
  creator_payout DECIMAL(10,2),
  commission_rate DECIMAL(5,4)
) AS $$
DECLARE
  applied_rate DECIMAL(5,4);
BEGIN
  -- Determine commission rate based on payment method
  IF payment_method = 'crypto' THEN
    applied_rate := user_crypto_rate;
  ELSE
    applied_rate := user_fiat_rate;
  END IF;
  
  commission_amount := ROUND(sale_amount * applied_rate, 2);
  platform_revenue := commission_amount;
  creator_payout := sale_amount - commission_amount;
  commission_rate := applied_rate;
  
  RETURN QUERY SELECT 
    calculate_commission.commission_amount,
    calculate_commission.platform_revenue,  
    calculate_commission.creator_payout,
    calculate_commission.commission_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to update project stats
CREATE OR REPLACE FUNCTION update_project_media_stats(project_id UUID)
RETURNS void AS $$
DECLARE
  stats_record RECORD;
BEGIN
  SELECT 
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COALESCE(SUM(revenue), 0) as total_revenue,
    COALESCE(SUM(downloads), 0) as total_downloads,
    COALESCE(AVG(individual_price), 0) as avg_price
  INTO stats_record
  FROM media_assets 
  WHERE client_project_id = project_id;

  INSERT INTO project_media_stats (
    client_project_id, 
    total_media_count, 
    approved_media_count, 
    pending_media_count,
    total_revenue, 
    total_downloads, 
    average_price,
    updated_at
  ) VALUES (
    project_id,
    stats_record.total_count,
    stats_record.approved_count, 
    stats_record.pending_count,
    stats_record.total_revenue,
    stats_record.total_downloads,
    stats_record.avg_price,
    NOW()
  )
  ON CONFLICT (client_project_id) DO UPDATE SET
    total_media_count = EXCLUDED.total_media_count,
    approved_media_count = EXCLUDED.approved_media_count,
    pending_media_count = EXCLUDED.pending_media_count,
    total_revenue = EXCLUDED.total_revenue,
    total_downloads = EXCLUDED.total_downloads,
    average_price = EXCLUDED.average_price,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;