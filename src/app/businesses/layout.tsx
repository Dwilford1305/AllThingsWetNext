import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Business Directory - Wetaskiwin, Alberta - All Things Wetaskiwin',
  description: 'Comprehensive directory of local businesses, services, shops, and restaurants in Wetaskiwin, Alberta. Find contact information, hours, and services.',
  keywords: 'Wetaskiwin businesses, local directory, Alberta businesses, shops, restaurants, services, business listings',
  openGraph: {
    title: 'Local Business Directory - Wetaskiwin, Alberta',
    description: 'Discover local businesses, services, and shops in Wetaskiwin, Alberta. Your comprehensive community business directory.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'Local Business Directory - Wetaskiwin, Alberta',
    description: 'Find local businesses, services, and shops in Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/businesses'
  }
};

export default function BusinessesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
