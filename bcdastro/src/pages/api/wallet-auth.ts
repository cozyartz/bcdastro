import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

interface WalletAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
  fullName?: string;
}

interface UserRecord {
  id: string;
  wallet_address: string;
  full_name?: string;
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  let body: WalletAuthRequest;
  try {
    body = await request.json() as WalletAuthRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { walletAddress, signature, message, fullName } = body;
  if (!walletAddress || !signature || !message) {
    return new Response(JSON.stringify({ error: 'Missing wallet address, signature, or message' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = locals.DB;
    if (!db) throw new Error('Database connection unavailable');

    // TODO: In production, verify the signature here using ethers.js or similar
    // For now, we'll assume the signature is valid
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if user already exists
    let user: UserRecord | null = await db.prepare('SELECT id, wallet_address, full_name FROM users WHERE wallet_address = ?')
      .bind(normalizedAddress)
      .first();

    if (!user) {
      // Create new user with wallet
      const userId = randomUUID();
      await db.prepare(`
        INSERT INTO users (
          id, wallet_address, wallet_type, wallet_connected, full_name, 
          is_verified, subscription_tier, subscription_status, 
          monthly_fee, fiat_commission_rate, crypto_commission_rate, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
        .bind(
          userId,
          normalizedAddress,
          'metamask', // Default to MetaMask, could be detected from request
          true,
          fullName || null,
          true, // Auto-verify wallet users
          'pro',
          'active',
          10.00,
          0.15, // 15% for fiat
          0.10  // 10% for crypto
        )
        .run();

      user = { id: userId, wallet_address: normalizedAddress, full_name: fullName };
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: '1d',
      algorithm: 'HS256',
    });

    return new Response(JSON.stringify({ 
      token,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        full_name: user.full_name
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

  } catch (error) {
    console.error('Wallet auth error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};