import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward login request to backend
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Create response object
    const result = NextResponse.json(data, { status: response.status });

    // If login was successful, copy Set-Cookie headers from backend response
    if (response.ok && response.headers.get('set-cookie')) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        result.headers.set('set-cookie', setCookie);
      }
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Failed to process login' },
      { status: 500 }
    );
  }
}
