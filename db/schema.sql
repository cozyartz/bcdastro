-- 🔄 Drop existing tables for clean dev cycles (optional, use with caution in production)
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS media_collaborators;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS users;

-- 👤 Users table (auth + content attribution + preferences + pilot certification + admin role)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  theme_preference TEXT CHECK(theme_preference IN ('dark', 'light', 'system')) DEFAULT 'system',
  part_107_certified BOOLEAN DEFAULT false,
  certification_number TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);

-- 🎞 Media table (videos/images with monetization metadata + collaboration)
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('image', 'video')) NOT NULL,
  cloudflare_id TEXT NOT NULL,
  preview_url TEXT,
  metadata JSON,
  fiat_price_cents INTEGER NOT NULL CHECK(fiat_price_cents >= 0),
  stripe_price_id TEXT,
  price_wei INTEGER,
  token_gated BOOLEAN DEFAULT false,
  token_address TEXT,
  chain_id TEXT,
  creator_wallet TEXT,
  accepts_stripe BOOLEAN DEFAULT true,
  accepts_crypto BOOLEAN DEFAULT true,
  slug TEXT UNIQUE NOT NULL,
  access_agent_id TEXT,
  status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_media_slug (slug),
  INDEX idx_media_creator_wallet (creator_wallet)
);

-- 🎬 Media Collaborators table (for multi-pilot ownership)
CREATE TABLE media_collaborators (
  media_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT CHECK(role IN ('creator', 'contributor')) DEFAULT 'contributor',
  PRIMARY KEY (media_id, user_id),
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_media_collaborators_user_id (user_id)
);

-- 💳 Purchase records (Stripe and Web3)
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  method TEXT CHECK(method IN ('stripe', 'web3')) NOT NULL,
  stripe_payment_id TEXT,
  tx_hash TEXT,
  chain_id TEXT,
  price_paid INTEGER NOT NULL CHECK(price_paid >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  INDEX idx_purchases_user_id (user_id),
  INDEX idx_purchases_media_id (media_id)
);