/*
  # Media Platform Database Schema

  1. New Tables
    - `users` - Extended user profiles with subscription tiers
    - `media_assets` - Individual photos/videos with pricing
    - `media_packages` - Grouped media for properties (like golf courses)
    - `purchases` - Transaction records for media sales
    - `download_logs` - Track download usage and limits

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Secure media asset management

  3. Business Logic
    - Individual, package, and exclusive pricing
    - Property-based media grouping
    - Revenue tracking and analytics
*/

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_verified boolean DEFAULT false,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  total_revenue decimal(10,2) DEFAULT 0,
  total_uploads integer DEFAULT 0
);

-- Media assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('video', 'image')),
  category text NOT NULL,
  cloudflare_id text NOT NULL,
  thumbnail_url text,
  duration text, -- For videos (e.g., "2:45")
  resolution text NOT NULL,
  file_size text NOT NULL,
  tags text[] DEFAULT '{}',
  
  -- Pricing structure
  individual_price decimal(8,2) NOT NULL,
  package_price decimal(8,2),
  exclusive_price decimal(8,2),
  is_exclusive boolean DEFAULT false,
  exclusive_buyer_id uuid REFERENCES users(id),
  
  -- Property information
  location text,
  property_type text,
  property_name text,
  
  -- Metadata
  upload_date timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  downloads integer DEFAULT 0,
  revenue decimal(10,2) DEFAULT 0,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || description || ' ' || array_to_string(tags, ' '))
  ) STORED
);

-- Media packages table (for property collections like golf courses)
CREATE TABLE IF NOT EXISTS media_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  property_name text NOT NULL,
  property_type text NOT NULL,
  location text NOT NULL,
  
  -- Media assets in this package
  media_assets uuid[] NOT NULL,
  
  -- Pricing
  package_price decimal(8,2) NOT NULL,
  individual_total decimal(8,2) NOT NULL, -- Sum of individual prices
  savings_amount decimal(8,2) NOT NULL, -- individual_total - package_price
  
  -- Exclusive rights
  is_exclusive boolean DEFAULT false,
  exclusive_price decimal(8,2),
  exclusive_buyer_id uuid REFERENCES users(id),
  
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'exclusive'))
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email text NOT NULL,
  buyer_name text,
  
  -- What was purchased
  media_asset_id uuid REFERENCES media_assets(id),
  package_id uuid REFERENCES media_packages(id),
  
  -- Purchase details
  license_type text NOT NULL CHECK (license_type IN ('standard', 'commercial', 'exclusive')),
  price_paid decimal(8,2) NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  
  -- Download tracking
  download_count integer DEFAULT 0,
  max_downloads integer DEFAULT 10, -- Standard license limit
  last_download timestamptz,
  
  -- Payment processing
  payment_intent_id text, -- Stripe payment intent
  payment_status text DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  CONSTRAINT purchase_target_check CHECK (
    (media_asset_id IS NOT NULL AND package_id IS NULL) OR
    (media_asset_id IS NULL AND package_id IS NOT NULL)
  )
);

-- Download logs for detailed tracking
CREATE TABLE IF NOT EXISTS download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  download_date timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  file_size_bytes bigint
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Media assets policies
CREATE POLICY "Anyone can view approved media"
  ON media_assets
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved' AND NOT is_exclusive);

CREATE POLICY "Users can view own media"
  ON media_assets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
  ON media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON media_assets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Media packages policies
CREATE POLICY "Anyone can view active packages"
  ON media_packages
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND NOT is_exclusive);

CREATE POLICY "Users can view own packages"
  ON media_packages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packages"
  ON media_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packages"
  ON media_packages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "Users can view own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = buyer_email OR
    EXISTS (
      SELECT 1 FROM media_assets ma 
      WHERE ma.id = purchases.media_asset_id AND ma.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM media_packages mp 
      WHERE mp.id = purchases.package_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create purchases"
  ON purchases
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Download logs policies
CREATE POLICY "Users can view related download logs"
  ON download_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases p
      JOIN media_assets ma ON ma.id = p.media_asset_id
      WHERE p.id = download_logs.purchase_id AND ma.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM purchases p
      JOIN media_packages mp ON mp.id = p.package_id
      WHERE p.id = download_logs.purchase_id AND mp.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(category);
CREATE INDEX IF NOT EXISTS idx_media_assets_search ON media_assets USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_media_packages_user_id ON media_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_media_asset_id ON purchases(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_purchases_package_id ON purchases(package_id);

-- Functions for business logic
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user revenue and upload counts
  UPDATE users SET
    total_revenue = (
      SELECT COALESCE(SUM(revenue), 0)
      FROM media_assets
      WHERE user_id = NEW.user_id
    ),
    total_uploads = (
      SELECT COUNT(*)
      FROM media_assets
      WHERE user_id = NEW.user_id
    ),
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT OR UPDATE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();