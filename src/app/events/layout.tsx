import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Events in Wetaskiwin, Alberta - All Things Wetaskiwin',
  description: 'Discover upcoming community events, festivals, workshops, and activities happening in Wetaskiwin, Alberta. Stay connected with your local community.',
  keywords: 'Wetaskiwin events, community activities, Alberta events, local festivals, workshops, community gatherings',
  openGraph: {
    title: 'Community Events in Wetaskiwin, Alberta',
    description: 'Stay up-to-date with the latest community events, festivals, and activities in Wetaskiwin, Alberta.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'Community Events in Wetaskiwin, Alberta',
    description: 'Discover upcoming events and activities in Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/events'
  }
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
