import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request, locals }) => {
  const { email, password } = await request.json();
  if (!email || !password) {
    return new Response('Missing email or password', { status: 400 });
  }

  const existingUser = await locals.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first();
  if (existingUser) {
    return new Response('User already exists', { status: 409 });
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  await locals.DB.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
    .bind(userId, email, passwordHash)
    .run();

  const token = jwt.sign({ userId }, import.meta.env.JWT_SECRET, { expiresIn: '1d' });
  return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' } });
};