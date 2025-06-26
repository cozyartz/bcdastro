-- Add crypto payment support to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'crypto'));
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_charge_id text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_currency text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_amount text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_wallet_address text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_transaction_hash text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_confirmation_count integer DEFAULT 0;

-- Create index for crypto payments
CREATE INDEX IF NOT EXISTS idx_purchases_crypto_charge_id ON purchases(crypto_charge_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_method ON purchases(payment_method);

-- Create crypto_payments table for detailed tracking
CREATE TABLE IF NOT EXISTS crypto_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  charge_id text UNIQUE NOT NULL,
  currency text NOT NULL, -- ETH, BTC, USDC, etc.
  amount text NOT NULL,
  wallet_address text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'expired')),
  transaction_hash text,
  confirmation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  expires_at timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS for crypto_payments
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;

-- Policies for crypto_payments
CREATE POLICY "Users can view crypto payments for their purchases"
  ON crypto_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases p
      WHERE p.id = crypto_payments.purchase_id
      AND (
        p.buyer_email = auth.jwt() ->> 'email' OR
        EXISTS (
          SELECT 1 FROM media_assets ma 
          WHERE ma.id = p.media_asset_id AND ma.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM media_packages mp 
          WHERE mp.id = p.package_id AND mp.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Anyone can create crypto payments"
  ON crypto_payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "System can update crypto payments"
  ON crypto_payments
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crypto_payments_charge_id ON crypto_payments(charge_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_purchase_id ON crypto_payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_expires_at ON crypto_payments(expires_at);

-- Function to update purchase status when crypto payment is confirmed
CREATE OR REPLACE FUNCTION handle_crypto_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the related purchase when crypto payment is confirmed
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE purchases SET
      payment_status = 'completed',
      crypto_charge_id = NEW.charge_id,
      crypto_currency = NEW.currency,
      crypto_amount = NEW.amount,
      crypto_wallet_address = NEW.wallet_address,
      crypto_transaction_hash = NEW.transaction_hash,
      crypto_confirmation_count = NEW.confirmation_count
    WHERE id = NEW.purchase_id;
  END IF;
  
  -- Update purchase status if payment fails or expires
  IF NEW.status IN ('failed', 'expired') AND OLD.status != NEW.status THEN
    UPDATE purchases SET
      payment_status = NEW.status
    WHERE id = NEW.purchase_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for crypto payment confirmation
CREATE TRIGGER crypto_payment_status_trigger
  AFTER UPDATE ON crypto_payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_crypto_payment_confirmation();

-- Function to clean up expired crypto payments
CREATE OR REPLACE FUNCTION cleanup_expired_crypto_payments()
RETURNS void AS $$
BEGIN
  -- Mark expired payments as expired
  UPDATE crypto_payments SET
    status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
    
  -- Update related purchases
  UPDATE purchases SET
    payment_status = 'failed'
  WHERE id IN (
    SELECT purchase_id FROM crypto_payments 
    WHERE status = 'expired'
  ) AND payment_status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired payments (if pg_cron is available)
-- This would typically be handled by your application or a separate cron job
-- SELECT cron.schedule('cleanup-expired-crypto-payments', '*/5 * * * *', 'SELECT cleanup_expired_crypto_payments();');