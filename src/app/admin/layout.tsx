import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - All Things Wetaskiwin',
  description: 'Administrative dashboard for managing the All Things Wetaskiwin platform',
  robots: 'noindex, nofollow', // Prevent search engines from indexing admin pages
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
