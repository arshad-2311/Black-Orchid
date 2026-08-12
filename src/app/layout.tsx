import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display, Cormorant_Garamond, Cinzel_Decorative } from "next/font/google";
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

const cinzel = Cinzel_Decorative({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Black Orchid",
  description:
    "Black Orchid is a stylish restobar in Anna Nagar East, Chennai, combining exquisite food, crafted cocktails, vibrant music, and elevated dining experiences.",
  servesCuisine: ["Multi-Cuisine", "Asian", "Indian", "Cocktails"],
  telephone: "+91 95850 18502",
  email: "boan.reservations@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "G Block, L33, 1st Avenue, R.V. Nagar, Brindhavan Colony, VOC Nagar, Anna Nagar East",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    postalCode: "600102",
    addressCountry: "IN",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "11:00",
      closes: "23:00",
    },
  ],
  acceptsReservations: "True",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${playfair.variable} ${cormorant.variable} ${cinzel.variable} antialiased bg-background text-foreground relative`}
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
