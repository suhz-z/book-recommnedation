"use client";
import { API_BASE } from "../lib/api";

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">
          📚 Book — Recommendations
        </h1>
        <p className="text-sm text-gray-600">
          Read more. Recommend better.
        </p>
      </div>
      <div className="text-right text-sm text-gray-500">
        <div>
          API: <code className="bg-gray-100 px-2 py-1 rounded">{API_BASE}</code>
        </div>
      </div>
    </header>
  );
}
