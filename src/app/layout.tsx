import type { Metadata, Viewport } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { CartProvider } from "@/contexts/CartContext";
import { UserProvider } from "@/contexts/UserContext";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import "./globals.css";

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // For iPhone notch/Dynamic Island
  themeColor: "#E8A07A", // Casita orange for browser UI
};

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Casita | Boutique Hotels & Unique Stays",
  description: "Discover handpicked boutique hotels and unique accommodations worldwide. Make yourself at home with Casita's curated collection of extraordinary stays.",
  keywords: ["boutique hotels", "luxury hotels", "unique stays", "vacation rentals", "travel", "accommodation"],
  authors: [{ name: "Hello Casita" }],
  creator: "Hello Casita",
  publisher: "Hello Casita",
  metadataBase: new URL("https://www.hellocasita.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.hellocasita.com",
    siteName: "Casita",
    title: "Casita | Boutique Hotels & Unique Stays",
    description: "Discover handpicked boutique hotels and unique accommodations worldwide.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Casita - Make Yourself at Home",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Casita | Boutique Hotels & Unique Stays",
    description: "Discover handpicked boutique hotels and unique accommodations worldwide.",
    images: ["/og-image.jpg"],
    creator: "@hellocasita",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Casita',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${cormorant.variable}`}>
      <body className="antialiased">
        <LocaleProvider>
          <UserProvider>
            <CartProvider>
              {children}
              <WhatsAppButton />
            </CartProvider>
          </UserProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
