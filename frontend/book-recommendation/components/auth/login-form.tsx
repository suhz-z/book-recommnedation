"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        // Post to the relative API route so Next.js rewrites/proxy handles the backend
        const res = await fetch(`/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
  
          console.log('Cookies after login:', document.cookie);
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('Can access cookie?', document.cookie.includes('access_token'));

          router.push("/");
          router.refresh(); // Refresh to update user state in layout
        } else {
          const data = await res.json();
          setError(data.detail || "Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("Network error. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Logging in..." : "Login"}
      </Button>

      <p className="text-sm text-center text-gray-600">
        Dont have an account?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Register here
        </Link>
      </p>
    </form>
  );
}
