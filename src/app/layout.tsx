import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";

import { Providers } from "@/providers/providers";
import "./globals.css";
import Header from "@/components/UI/header";
import { siteConfig } from "@/config/site.config";
import { layoutConfig } from "@/config/layout.config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />

          <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            {children}
          </main>
          <footer
            className="flex items-center justify-center bg-zinc-50 p-4 dark:bg-black"
            style={{ height: layoutConfig.footerHeight }}
          >
            <p>{siteConfig.description}</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
