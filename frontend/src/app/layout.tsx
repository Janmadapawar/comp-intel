import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CompIntel — Compensation Intelligence for Indian Tech",
  description: "Level-standardized salary data for Indian tech. Make smarter career decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-white">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
