-- Drop existing tables for dev cycles (optional)
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS users;

-- Users table (for auth + attribution)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Media table (video or image, monetizable)
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('image', 'video')) NOT NULL,
  cloudflare_id TEXT NOT NULL,
  preview_url TEXT,
  metadata TEXT,
  fiat_price_cents INTEGER CHECK(fiat_price_cents >= 0),
  stripe_price_id TEXT,
  price_wei INTEGER CHECK(price_wei >= 0),
  token_gated BOOLEAN DEFAULT false,
  token_address TEXT,
  chain_id TEXT,
  creator_wallet TEXT,
  accepts_stripe BOOLEAN DEFAULT true,
  accepts_crypto BOOLEAN DEFAULT true,
  slug TEXT UNIQUE,
  access_agent_id TEXT
);

-- Purchase records (Stripe or Web3)
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
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
);
