// lib/auth.ts
import { cookies } from 'next/headers';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) return null;

  try {
    // Use relative path so Next's app API route handles the request
    const response = await fetch(`/api/auth/me`, {
      headers: {
        Cookie: `access_token=${token}`,
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Session verification failed:', error);
  }

  return null;
}
