import { createClient } from '@/lib/supabase-server';
import { generateCsrfToken } from '@/lib/csrf';
import { NextResponse } from 'next/server';

/**
 * GET /api/csrf
 * Generate a CSRF token for the current session
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use user ID or generate anonymous session ID
    const sessionId = user?.id || request.headers.get('x-request-id') || crypto.randomUUID();

    const token = generateCsrfToken(sessionId);

    const response = NextResponse.json({
      success: true,
      token,
    });

    // Also set as cookie for double-submit pattern
    response.cookies.set('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
