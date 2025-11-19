import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Book — Recommendations",
  description: "read more books you'll love",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </body>
    </html>
  );
}
