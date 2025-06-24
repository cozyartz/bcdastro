import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  email: string;
  password: string;
}

interface UserRecord {
  id: string;
  password_hash: string;
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  let body: LoginRequest;
  try {
    body = await request.json() as LoginRequest;
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

  let user: UserRecord | null;
  try {
    const db = locals.DB;
    if (!db) throw new Error('Database connection unavailable');

    user = await db.prepare('SELECT id, password_hash FROM users WHERE email = ?')
      .bind(email.toLowerCase()) // Case-insensitive email
      .first();
  } catch (error) {
    console.error('Database query error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: '1d',
      algorithm: 'HS256', // Explicitly set algorithm for security
    });
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, // Prevent caching
    });
  } catch (error) {
    console.error('Token generation error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to generate token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};