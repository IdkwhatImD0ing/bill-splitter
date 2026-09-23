import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bills.art3m1s.me'),
  title: {
    default: "Bill Splitter - Split Bills Easily",
    template: "%s | Bill Splitter"
  },
  description: "Split bills and track who owes what with Bill Splitter. Upload receipts, create bill splits, and share with friends.",
  keywords: ["bill split", "receipt", "expense sharing", "split expenses", "bill tracker"],
  authors: [{ name: "Bill Splitter" }],
  creator: "Bill Splitter",
  publisher: "Bill Splitter",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Bill Splitter - Split Bills Easily",
    description: "Split bills and track who owes what with Bill Splitter. Upload receipts, create bill splits, and share with friends.",
    url: "/",
    siteName: "Bill Splitter",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Bill Splitter - Split Bills Easily",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bill Splitter - Split Bills Easily",
    description: "Split bills and track who owes what with Bill Splitter.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c4663a" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1512" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
