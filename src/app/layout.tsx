import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";

import { Providers } from "@/providers/providers";
import "./globals.css";
import Header from "@/components/UI/header";

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
  title: "Русская кухня",
  description: "Рецепты кухни",
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
