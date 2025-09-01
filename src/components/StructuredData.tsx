import Script from 'next/script'

interface LocalBusinessSchema {
  name: string
  description?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  url?: string
  telephone?: string
  email?: string
  image?: string
}

interface EventSchema {
  name: string
  description?: string
  startDate?: string
  endDate?: string
  location?: {
    name?: string
    address?: string
  }
  organizer?: {
    name?: string
    url?: string
  }
  url?: string
  image?: string
}

interface NewsArticleSchema {
  headline: string
  description?: string
  author?: string
  datePublished?: string
  dateModified?: string
  image?: string
  url?: string
  publisher?: {
    name?: string
    logo?: string
  }
}

interface WebsiteSchema {
  name: string
  description: string
  url: string
  potentialAction?: {
    '@type': string
    target: string
    'query-input': string
  }
  sameAs?: string[]
}

interface StructuredDataProps {
  type: 'LocalBusiness' | 'Event' | 'NewsArticle' | 'WebSite'
  data: LocalBusinessSchema | EventSchema | NewsArticleSchema | WebsiteSchema
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const generateSchema = () => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': type,
    }

    switch (type) {
      case 'WebSite':
        const websiteData = data as WebsiteSchema
        return {
          ...baseSchema,
          name: websiteData.name,
          description: websiteData.description,
          url: websiteData.url,
          potentialAction: websiteData.potentialAction || {
            '@type': 'SearchAction',
            target: `${websiteData.url}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          },
          sameAs: websiteData.sameAs || []
        }

      case 'LocalBusiness':
        const businessData = data as LocalBusinessSchema
        return {
          ...baseSchema,
          name: businessData.name,
          description: businessData.description,
          address: businessData.address && {
            '@type': 'PostalAddress',
            ...businessData.address
          },
          url: businessData.url,
          telephone: businessData.telephone,
          email: businessData.email,
          image: businessData.image
        }

      case 'Event':
        const eventData = data as EventSchema
        return {
          ...baseSchema,
          name: eventData.name,
          description: eventData.description,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          location: eventData.location && {
            '@type': 'Place',
            name: eventData.location.name,
            address: eventData.location.address
          },
          organizer: eventData.organizer && {
            '@type': 'Organization',
            name: eventData.organizer.name,
            url: eventData.organizer.url
          },
          url: eventData.url,
          image: eventData.image
        }

      case 'NewsArticle':
        const articleData = data as NewsArticleSchema
        return {
          ...baseSchema,
          headline: articleData.headline,
          description: articleData.description,
          author: articleData.author && {
            '@type': 'Person',
            name: articleData.author
          },
          datePublished: articleData.datePublished,
          dateModified: articleData.dateModified,
          image: articleData.image,
          url: articleData.url,
          publisher: articleData.publisher && {
            '@type': 'Organization',
            name: articleData.publisher.name,
            logo: {
              '@type': 'ImageObject',
              url: articleData.publisher.logo
            }
          }
        }

      default:
        return baseSchema
    }
  }

  const schema = generateSchema()

  return (
    <Script
      id={`structured-data-${type.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  )
}

// Pre-configured components for common schemas
export function WebsiteStructuredData() {
  return (
    <StructuredData
      type="WebSite"
      data={{
        name: 'All Things Wetaskiwin',
        description: 'Your comprehensive community hub for events, news, local businesses, jobs, and marketplace listings in Wetaskiwin, Alberta.',
        url: 'https://allthingswetaskiwin.com',
        sameAs: []
      }}
    />
  )
}

export function LocalBusinessDirectoryStructuredData() {
  return (
    <StructuredData
      type="LocalBusiness"
      data={{
        name: 'All Things Wetaskiwin - Business Directory',
        description: 'Comprehensive directory of local businesses and services in Wetaskiwin, Alberta.',
        address: {
          addressLocality: 'Wetaskiwin',
          addressRegion: 'Alberta',
          addressCountry: 'CA'
        },
        url: 'https://allthingswetaskiwin.com/businesses'
      }}
    />
  )
}