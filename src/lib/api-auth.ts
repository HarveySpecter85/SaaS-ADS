import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

/**
 * Validates that the request is from an authenticated user.
 * Use this at the start of all protected API routes.
 *
 * @example
 * export async function GET() {
 *   const auth = await requireAuth();
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 *   // ... rest of handler
 * }
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Returns the authenticated user or null (no error response).
 * Use when authentication is optional.
 */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
