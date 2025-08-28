import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Classifieds - Buy, Sell & Trade in Wetaskiwin, Alberta',
  description: 'Browse local classified ads for buying, selling, and trading items in Wetaskiwin, Alberta. Find great deals on furniture, electronics, vehicles, and more.',
  keywords: 'Wetaskiwin classifieds, buy sell trade Alberta, local marketplace, classified ads, used items Wetaskiwin',
  openGraph: {
    title: 'Local Classifieds - Wetaskiwin, Alberta',
    description: 'Buy, sell, and trade items locally in Wetaskiwin, Alberta. Your community marketplace for great deals.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'Local Classifieds - Wetaskiwin, Alberta',
    description: 'Browse local classified ads for buying, selling, and trading in Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/classifieds'
  }
};

export default function ClassifiedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
