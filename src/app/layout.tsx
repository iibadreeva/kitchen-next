import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";

import { Providers } from "@/providers/providers";
import "./globals.css";
import Header from "@/components/UI/header";
import { siteConfig } from "@/config/site.config";
import { layoutConfig } from "@/config/layout.config";
import Title from "@/components/UI/layout/title";

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
          <Title />

          <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-2 pb-16 font-sans sm:px-6 sm:pb-20">
            {children}
          </main>
          <footer
            className="flex items-center justify-center p-4"
            style={{ height: layoutConfig.footerHeight }}
          >
            <p>{siteConfig.description}</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
