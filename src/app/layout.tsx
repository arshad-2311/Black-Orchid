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
        className={`${geistSans.variable} ${playfair.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
