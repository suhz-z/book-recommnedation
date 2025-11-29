import "./globals.css";
import type { ReactNode } from "react";
import { QueryProvider } from "./providers";

export const metadata = {
  title: "Book — Recommendations",
  description: "read more books you'll love",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
        <div className ="min-h-screen">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
        </QueryProvider>
      </body>
    </html>
  );
}
