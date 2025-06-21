import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request, locals }) => {
  const { email, password } = await request.json();
  if (!email || !password) {
    return new Response('Missing email or password', { status: 400 });
  }

  const user = await locals.DB.prepare('SELECT id, password_hash FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return new Response('Invalid credentials', { status: 401 });
  }

  const token = jwt.sign({ userId: user.id }, import.meta.env.JWT_SECRET, { expiresIn: '1d' });
  return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' } });
};