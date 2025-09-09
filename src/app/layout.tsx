import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

import Script from "next/script";
import DevelopmentBanner from "@/components/DevelopmentBanner";
import CookieConsent from "@/components/CookieConsent";
import { WebsiteStructuredData } from "@/components/StructuredData";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://allthingswetaskiwin.ca' : 'http://localhost:3000'),
  title: "All Things Wetaskiwin - Your Community Hub | Wetaskiwin, Alberta",
  description: "Discover events, news, local businesses, jobs, and marketplace listings in Wetaskiwin, Alberta. Your comprehensive community hub for staying connected with Wetaskiwin events and local activities.",
  keywords: "Wetaskiwin events, Wetaskiwin Alberta, Wetaskiwin community, Wetaskiwin businesses, Wetaskiwin jobs, Wetaskiwin marketplace, Wetaskiwin news, Alberta events, local events Wetaskiwin, community hub Wetaskiwin",
  authors: [{ name: "All Things Wetaskiwin" }],
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  other: {
    'geo.region': 'CA-AB',
    'geo.placename': 'Wetaskiwin',
    'geo.position': '52.9686;-113.3741',
    'ICBM': '52.9686, -113.3741',
    'DC.title': 'All Things Wetaskiwin - Community Hub',
    'DC.description': 'Comprehensive community platform for Wetaskiwin, Alberta events, businesses, and local information',
    'DC.language': 'en-CA',
    'DC.coverage': 'Wetaskiwin, Alberta, Canada',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "All Things Wetaskiwin",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "All Things Wetaskiwin - Your Community Hub | Wetaskiwin, Alberta",
    description: "Discover upcoming events, local businesses, jobs, and community news in Wetaskiwin, Alberta. Your comprehensive resource for staying connected with the Wetaskiwin community.",
    type: "website",
    locale: "en_CA",
    url: '/',
    siteName: 'All Things Wetaskiwin',
    images: [
      {
        url: '/WaterTower.png',
        width: 1200,
        height: 630,
        alt: 'Wetaskiwin Water Tower - All Things Wetaskiwin Community Hub'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@AllThingsWetaskiwinq',
    title: 'All Things Wetaskiwin - Your Community Hub | Wetaskiwin, Alberta',
    description: 'Discover events, businesses, and community news in Wetaskiwin, Alberta.',
    images: ['/WaterTower.png']
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-CA': '/',
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: 'Community',
  classification: 'Community Hub'
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#2563eb",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="All Things Wetaskiwin" />
        
        {/* Structured Data */}
        <WebsiteStructuredData />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-setup" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className="antialiased overflow-x-hidden max-w-full w-screen font-sans"
      >
        <Providers>
          <DevelopmentBanner />
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
