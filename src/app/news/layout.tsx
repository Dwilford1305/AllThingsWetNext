import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wetaskiwin News Alberta | Local News & Community Updates - All Things Wetaskiwin',
  description: 'Stay informed with the latest local news, community updates, and announcements from Wetaskiwin, Alberta. Your source for Wetaskiwin news and local journalism.',
  keywords: 'Wetaskiwin news, Wetaskiwin Alberta news, local news Alberta, community updates Wetaskiwin, Wetaskiwin announcements, local journalism Alberta, news Wetaskiwin',
  openGraph: {
    title: 'Wetaskiwin News Alberta | Local News & Community Updates',
    description: 'Stay informed with the latest local news, community updates, and announcements from Wetaskiwin, Alberta.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
    url: '/news',
  },
  twitter: {
    card: 'summary',
    title: 'Wetaskiwin News Alberta | Local News & Community Updates',
    description: 'Latest local news and community updates from Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/news',
    languages: {
      'en-CA': '/news',
    },
  },
  other: {
    'geo.region': 'CA-AB',
    'geo.placename': 'Wetaskiwin',
    'geo.position': '52.9686;-113.3741',
    'ICBM': '52.9686, -113.3741',
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
