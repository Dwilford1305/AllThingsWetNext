import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News - All Things Wetaskiwin',
  description: 'Stay updated with the latest news and updates from Wetaskiwin',
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
