import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import NavBar from "@/components/NavBar";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://trusswork.org"),
  title: "Truss — The Backbone of Every Show",
  description: "The marketplace for corporate AV technicians and event producers",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Truss — The Backbone of Every Show",
    description: "The marketplace for corporate AV technicians and event producers.",
    url: "https://trusswork.org",
    siteName: "Truss",
    images: [
      {
        url: "/truss-og-image.png",
        width: 1200,
        height: 630,
        alt: "Truss — The AV Marketplace",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Truss — The Backbone of Every Show",
    description: "The marketplace for corporate AV technicians and event producers.",
    images: ["/truss-og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-J8SLRTNTT4" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J8SLRTNTT4');
          `}
        </Script>
      </head>
      <body className="bg-blackout text-house-lights font-body min-h-screen">
        <Providers>
          <NavBar />
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}