import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "All Things Wetaskiwin - Your Community Hub",
  description: "Your comprehensive community hub for events, news, local businesses, jobs, and classifieds in Wetaskiwin, Alberta. Stay connected with your community.",
  keywords: "Wetaskiwin, Alberta, community, events, businesses, jobs, classifieds, news, local",
  authors: [{ name: "All Things Wetaskiwin" }],
  openGraph: {
    title: "All Things Wetaskiwin - Your Community Hub",
    description: "Stay connected with your Wetaskiwin community through events, local businesses, job opportunities, and more.",
    type: "website",
    locale: "en_CA",
  },
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
        {children}
      </body>
    </html>
  );
}
