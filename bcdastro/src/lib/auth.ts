import jsonwebtoken from 'jsonwebtoken';

interface JWTPayload extends jsonwebtoken.JwtPayload {
  userId: string;
}

export function verifyJWT(token: string | null, secret: string): string | null {
  if (!token || !token.startsWith('Bearer ') || !secret) {
    return null;
  }

  const rawToken = token.slice(7); // Remove "Bearer "
  try {
    const payload = jsonwebtoken.verify(rawToken, secret) as JWTPayload;
    if (!payload.userId || typeof payload.userId !== 'string') {
      throw new Error('Invalid or missing userId in JWT payload');
    }
    return payload.userId;
  } catch (err) {
    console.warn('JWT verification failed:', err instanceof Error ? err.message : 'Unknown error');
    return null;
  }
}

export async function getSession(request: Request, env: { JWT_SECRET?: string }): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('Authorization');
  const secret = env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET is not configured in environment');
    throw new Error('Authentication configuration error: JWT_SECRET missing'); // Throw error for upstream handling
  }

  const userId = verifyJWT(authHeader, secret);
  return userId ? { userId } : null;
}