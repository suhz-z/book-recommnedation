// lib/auth.ts
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  
  if (!token) return null;

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Cookie: `session_token=${token}`, // Pass cookie to FastAPI
      },
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
