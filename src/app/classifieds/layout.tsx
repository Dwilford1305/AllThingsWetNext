import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Classifieds - All Things Wetaskiwin',
  description: 'Buy, sell, and trade items locally in Wetaskiwin',
};

export default function ClassifiedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
