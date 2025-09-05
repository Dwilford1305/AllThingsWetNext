import { Metadata } from 'next';
import { EventsPageStructuredData } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Events Wetaskiwin Alberta | Community Events Calendar - All Things Wetaskiwin',
  description: 'Find all upcoming events in Wetaskiwin, Alberta. Discover local festivals, community gatherings, workshops, and activities happening in Wetaskiwin. Your complete events calendar for Wetaskiwin Alberta.',
  keywords: 'events Wetaskiwin, Wetaskiwin events, events Wetaskiwin Alberta, Wetaskiwin community events, Wetaskiwin Alberta events, local festivals Wetaskiwin, workshops Wetaskiwin, community gatherings Wetaskiwin, activities Wetaskiwin, events calendar Wetaskiwin',
  openGraph: {
    title: 'Events Wetaskiwin Alberta | Community Events Calendar',
    description: 'Discover all upcoming events, festivals, and community activities in Wetaskiwin, Alberta. Stay up-to-date with the latest events in Wetaskiwin.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
    url: '/events',
  },
  twitter: {
    card: 'summary',
    title: 'Events Wetaskiwin Alberta | Community Events Calendar',
    description: 'Find upcoming events, festivals, and activities in Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/events',
    languages: {
      'en-CA': '/events',
    },
  },
  other: {
    'geo.region': 'CA-AB',
    'geo.placename': 'Wetaskiwin',
    'geo.position': '52.9686;-113.3741',
    'ICBM': '52.9686, -113.3741',
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EventsPageStructuredData />
      {children}
    </>
  );
}
