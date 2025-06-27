import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
  isAdmin?: boolean;
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  let body: SignupRequest;
  try {
    body = await request.json() as SignupRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email, password, fullName, isAdmin } = body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid email or password' }), {
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

  let existingUser;
  try {
    const db = locals.DB;
    if (!db) throw new Error('Database connection unavailable');

    existingUser = await db.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase()) // Case-insensitive
      .first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Database query error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = locals.DB;
    if (!db) throw new Error('Database connection unavailable');
    
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12); // Increased salt rounds for security
    
    // Handle special case for admin user
    const isAdminUser = isAdmin && email.toLowerCase() === 'cozy2963@gmail.com';
    
    await db.prepare(`
      INSERT INTO users (
        id, email, password_hash, full_name, is_admin, is_verified, 
        subscription_tier, subscription_status, monthly_fee, 
        fiat_commission_rate, crypto_commission_rate, wallet_connected,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(
        userId, 
        email.toLowerCase(), 
        passwordHash,
        fullName || null,
        isAdminUser || false,
        isAdminUser || false, // Auto-verify admin
        isAdminUser ? 'enterprise' : 'pro',
        'active',
        isAdminUser ? 0 : 10.00,   // Admin pays no monthly fee
        isAdminUser ? 0 : 0.15,    // Admin pays no fiat commission
        isAdminUser ? 0 : 0.10,    // Admin pays no crypto commission
        false                      // Wallet not connected by default
      )
      .run();

    const token = jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: '1d',
      algorithm: 'HS256',
    });
    return new Response(JSON.stringify({ token }), {
      status: 201, // Created
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Signup error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};