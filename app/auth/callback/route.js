import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the next URL or dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error, redirect to signin page
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_error`);
}
