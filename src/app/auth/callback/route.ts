import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Whitelist of allowed redirect paths
const ALLOWED_PATHS = ["/", "/brands", "/products", "/campaigns", "/assets", "/conversions", "/settings"];

/**
 * Validates that the redirect path is safe (relative and whitelisted).
 */
function isValidRedirectPath(path: string): boolean {
  // Must start with / and not contain protocol or double slashes
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return false;
  }
  // Check against whitelist (allow exact match or subpaths)
  return ALLOWED_PATHS.some(allowed => path === allowed || path.startsWith(`${allowed}/`));
}

/**
 * Handles OAuth and magic link callbacks from Supabase Auth.
 * Exchanges the auth code for a session and redirects to home.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Validate redirect path to prevent open redirect attacks
  const safePath = isValidRedirectPath(next) ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  }

  // If no code or error, redirect to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
