// lib/auth.ts
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getSession() {
  // Try to read an `access_token` cookie from the Next app (may be present in dev)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    // If token exists in Next app's cookie store, we still prefer letting the
    // browser send cookies automatically. We'll call the backend without
    // manually setting the Cookie header.
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Session verification failed:', error);
  }

  return null;
}
