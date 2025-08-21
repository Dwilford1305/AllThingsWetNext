import { NextResponse } from 'next/server';
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware';

async function deprecatedAdminAuth(_request: AuthenticatedRequest) {
  // Endpoint retained for backward compatibility; real auth handled via /api/auth/login and JWT
  return NextResponse.json({
    success: true,
    message: 'Already authenticated as admin; this endpoint is deprecated.'
  });
}

export const POST = withRole(['admin','super_admin'], deprecatedAdminAuth);
