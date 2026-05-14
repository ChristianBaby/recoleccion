import { NextRequest } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/utils/jwt';
import { errorResponse } from '@/lib/utils/response';

export function getAuthUser(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.split(' ')[1];
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) {
    return { user: null, error: errorResponse('No autorizado', 401, 'UNAUTHORIZED') };
  }
  return { user, error: null };
}

export function requireRole(request: NextRequest, ...roles: string[]) {
  const { user, error } = requireAuth(request);
  if (error) return { user: null, error };
  if (!roles.includes(user!.role)) {
    return { user: null, error: errorResponse('Sin permisos suficientes', 403, 'FORBIDDEN') };
  }
  return { user, error: null };
}
