import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Marketplace - Buy, Sell & Trade in Wetaskiwin, Alberta',
  description: 'Browse local marketplace listings for buying, selling, and trading items in Wetaskiwin, Alberta. Find great deals on furniture, electronics, vehicles, and more.',
  keywords: 'Wetaskiwin marketplace, buy sell trade Alberta, local marketplace, classified ads, used items Wetaskiwin',
  openGraph: {
    title: 'Local Marketplace - Wetaskiwin, Alberta',
    description: 'Buy, sell, and trade items locally in Wetaskiwin, Alberta. Your community marketplace for great deals.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'Local Marketplace - Wetaskiwin, Alberta',
    description: 'Browse local marketplace listings for buying, selling, and trading in Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/marketplace'
  }
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}