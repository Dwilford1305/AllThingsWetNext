import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

import Script from "next/script";
import DevelopmentBanner from "@/components/DevelopmentBanner";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "All Things Wetaskiwin - Your Community Hub",
  description: "Your comprehensive community hub for events, news, local businesses, jobs, and classifieds in Wetaskiwin, Alberta. Stay connected with your community.",
  keywords: "Wetaskiwin, Alberta, community, events, businesses, jobs, classifieds, news, local",
  authors: [{ name: "All Things Wetaskiwin" }],
  manifest: "/manifest.json",
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
    title: "All Things Wetaskiwin - Your Community Hub",
    description: "Stay connected with your Wetaskiwin community through events, local businesses, job opportunities, and more.",
    type: "website",
    locale: "en_CA",
  },
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
