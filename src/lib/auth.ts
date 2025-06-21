import jwt from 'jsonwebtoken';

export async function verifyJWT(token: string | null, secret: string) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token.replace('Bearer ', ''), secret) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function getSession(request: Request) {
  const token = request.headers.get('Authorization');
  const userId = await verifyJWT(token, import.meta.env.JWT_SECRET);
  return userId ? { userId } : null;
}