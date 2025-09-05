import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Business Directory Wetaskiwin Alberta | All Things Wetaskiwin',
  description: 'Comprehensive directory of local businesses, services, shops, and restaurants in Wetaskiwin, Alberta. Find contact information, hours, and services for Wetaskiwin businesses.',
  keywords: 'Wetaskiwin businesses, Wetaskiwin Alberta businesses, local directory Wetaskiwin, Alberta businesses, shops Wetaskiwin, restaurants Wetaskiwin, services Wetaskiwin, business listings Wetaskiwin, Wetaskiwin business directory',
  openGraph: {
    title: 'Local Business Directory Wetaskiwin Alberta',
    description: 'Discover local businesses, services, and shops in Wetaskiwin, Alberta. Your comprehensive community business directory.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
    url: '/businesses',
  },
  twitter: {
    card: 'summary',
    title: 'Local Business Directory Wetaskiwin Alberta',
    description: 'Find local businesses, services, and shops in Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/businesses',
    languages: {
      'en-CA': '/businesses',
    },
  },
  other: {
    'geo.region': 'CA-AB',
    'geo.placename': 'Wetaskiwin',
    'geo.position': '52.9686;-113.3741',
    'ICBM': '52.9686, -113.3741',
  },
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
