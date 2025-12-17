import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Digital Garden",
  description: "A private, minimalist book tracker.",
  manifest: '/manifest.json',
};

import { ThemeProvider } from '@/components/ThemeProvider';
import { MobileNav } from "@/components/MobileNav";
import { AuthListener } from "@/components/AuthListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfair.variable} antialiased flex min-h-screen bg-background text-text-main`}
      >
        <ThemeProvider>
          <AuthListener />
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
            {children}
          </div>
          <MobileNav />
        </ThemeProvider >
      </body >
    </html >
  );
}
