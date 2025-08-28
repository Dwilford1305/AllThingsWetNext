import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local News & Updates - Wetaskiwin, Alberta - All Things Wetaskiwin',
  description: 'Stay informed with the latest local news, community updates, and announcements from Wetaskiwin, Alberta and surrounding areas.',
  keywords: 'Wetaskiwin news, local news Alberta, community updates, Wetaskiwin announcements, local journalism',
  openGraph: {
    title: 'Local News & Updates - Wetaskiwin, Alberta',
    description: 'Stay informed with the latest local news, community updates, and announcements from Wetaskiwin, Alberta.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'Local News & Updates - Wetaskiwin, Alberta',
    description: 'Latest local news and community updates from Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/news'
  }
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
