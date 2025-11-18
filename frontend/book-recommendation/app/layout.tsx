import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "BookCrossing — Recommendations",
  description: "Frontend for BookCrossing FastAPI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </body>
    </html>
  );
}
