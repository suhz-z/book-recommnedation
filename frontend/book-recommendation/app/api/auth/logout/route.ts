import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token');

    // Forward logout request to backend with token
    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: token ? { Cookie: `access_token=${token.value}` } : {},
    });

    const data = await response.json();

    // Create response object
    const result = NextResponse.json(data, { status: response.status });

    // Clear the access_token cookie
    result.cookies.delete('access_token');

    return result;
  } catch (error) {
    console.error('Logout error:', error);
    
    const result = NextResponse.json(
      { detail: 'Failed to process logout' },
      { status: 500 }
    );
    
    // Still clear the cookie even on error
    result.cookies.delete('access_token');
    
    return result;
  }
}
