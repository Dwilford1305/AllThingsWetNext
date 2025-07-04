import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Businesses - All Things Wetaskiwin',
  description: 'Discover local businesses and services in Wetaskiwin',
};

export default function BusinessesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
