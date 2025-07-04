import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events - All Things Wetaskiwin',
  description: 'Discover upcoming events and activities in Wetaskiwin',
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
