import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const POST: APIRoute = async ({ request }) => {
  try {
    // This is a development-only endpoint for running migrations
    if (import.meta.env.PROD) {
      return new Response(JSON.stringify({ error: 'Not available in production' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check authentication (in a real app, you'd want proper auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer admin-dev-key') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Run the crypto payments migration
    const migrationSql = `
      -- Add crypto payment support to purchases table
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'crypto'));
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_charge_id text;
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_currency text;
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_amount text;
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_wallet_address text;
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_transaction_hash text;
      ALTER TABLE purchases ADD COLUMN IF NOT EXISTS crypto_confirmation_count integer DEFAULT 0;

      -- Create indexes if they don't exist
      CREATE INDEX IF NOT EXISTS idx_purchases_crypto_charge_id ON purchases(crypto_charge_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_payment_method ON purchases(payment_method);

      -- Create crypto_payments table for detailed tracking
      CREATE TABLE IF NOT EXISTS crypto_payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
        charge_id text UNIQUE NOT NULL,
        currency text NOT NULL,
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
    `;

    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (migrationError) {
      // Try running the SQL directly if the RPC function doesn't exist
      const queries = migrationSql.split(';').filter(query => query.trim());
      
      for (const query of queries) {
        if (query.trim()) {
          const { error } = await supabase.from('_internal').select('1').limit(0); // This will fail but test connection
          
          // Since we can't run raw SQL through the client, we'll return the migration script
          return new Response(JSON.stringify({ 
            message: 'Migration SQL generated',
            sql: migrationSql,
            instructions: 'Please run this SQL manually in your Supabase SQL editor'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Migration completed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};