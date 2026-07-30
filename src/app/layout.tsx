import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Black Orchid — Fine Dining & Banquet | Luxury Restaurant",
  description:
    "Black Orchid is a premier luxury restaurant & banquet facility offering exquisite cuisine, an opulent ambience, and unforgettable dining experiences. Reserve your table today.",
  keywords: [
    "luxury restaurant",
    "fine dining",
    "banquet facility",
    "catering",
    "Black Orchid",
    "private events",
    "gourmet cuisine",
  ],
  authors: [{ name: "Black Orchid" }],
  openGraph: {
    title: "Black Orchid — Fine Dining & Banquet",
    description:
      "A premier luxury restaurant & banquet facility. Exquisite cuisine, opulent ambience, unforgettable experiences.",
    siteName: "Black Orchid",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Black Orchid — Fine Dining & Banquet",
    description: "A premier luxury restaurant & banquet facility.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${playfair.variable} ${cormorant.variable} antialiased bg-background text-foreground relative`}
      >
        {/* Global film grain texture — barely visible, adds richness */}
        <div
          className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025] mix-blend-overlay"
          aria-hidden
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
