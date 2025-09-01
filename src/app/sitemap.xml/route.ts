import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Generate XML sitemap with all public pages
export async function GET(_request: NextRequest) {
  const h = await headers()
  const host = h.get('host') || 'allthingswetaskiwin.com'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`

  // Define all public pages with their priorities and update frequencies
  const pages = [
    {
      url: '',
      changefreq: 'daily',
      priority: '1.0',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/events',
      changefreq: 'daily',
      priority: '0.9',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/businesses',
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/news',
      changefreq: 'daily',
      priority: '0.8',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/jobs',
      changefreq: 'daily',
      priority: '0.8',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/marketplace',
      changefreq: 'daily',
      priority: '0.7',
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      url: '/privacy-policy',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: '2024-01-01'
    },
    {
      url: '/terms-of-service',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: '2024-01-01'
    },
    {
      url: '/accessibility',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: '2024-01-01'
    }
  ]

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}