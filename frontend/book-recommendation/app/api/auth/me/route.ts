// app/api/auth/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Cookie: `access_token=${token.value}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Auth check failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
