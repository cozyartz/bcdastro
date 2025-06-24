import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { crypto } from 'crypto';

interface SignupRequest {
  email: string;
  password: string;
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

  const { email, password } = body;
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
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12); // Increased salt rounds for security
    await db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
      .bind(userId, email.toLowerCase(), passwordHash)
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