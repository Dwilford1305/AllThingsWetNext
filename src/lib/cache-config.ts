/**
 * Cache Configuration and HTTP Headers
 * 
 * Provides standardized cache headers for different types of content
 */

/**
 * Cache control directives for different content types
 */
export const CacheControl = {
  // Static content that rarely changes (1 hour browser, 1 day CDN)
  STATIC: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
  
  // Semi-static content that changes occasionally (5 minutes browser, 1 hour CDN)
  SEMI_STATIC: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=3600',
  
  // Dynamic content that changes frequently (2 minutes browser, 5 minutes CDN)
  DYNAMIC: 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
  
  // Real-time content that changes often (30 seconds browser, 2 minutes CDN)
  REALTIME: 'public, max-age=30, s-maxage=120, stale-while-revalidate=300',
  
  // Private content that shouldn't be cached by CDN
  PRIVATE: 'private, max-age=300, must-revalidate',
  
  // No caching for sensitive or frequently changing data
  NO_CACHE: 'no-store, no-cache, must-revalidate, proxy-revalidate',
  
  // API responses with short cache
  API_SHORT: 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
  
  // API responses with medium cache
  API_MEDIUM: 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200',
  
  // API responses with long cache
  API_LONG: 'public, max-age=600, s-maxage=1800, stale-while-revalidate=3600',
} as const

/**
 * Get appropriate cache headers based on content type
 */
export function getCacheHeaders(type: keyof typeof CacheControl) {
  return {
    'Cache-Control': CacheControl[type],
    'CDN-Cache-Control': CacheControl[type],
  }
}

/**
 * Cache invalidation patterns for different data types
 */
export const CacheInvalidationPatterns = {
  EVENTS: ['events:', 'api:events'],
  NEWS: ['news:', 'api:news'],
  BUSINESSES: ['businesses:', 'api:businesses'],
  JOBS: ['jobs:', 'api:jobs'],
  MARKETPLACE: ['marketplace:', 'api:marketplace'],
  ALL: ['events:', 'news:', 'businesses:', 'jobs:', 'marketplace:', 'api:'],
} as const

/**
 * Helper to determine cache strategy based on query parameters
 */
export function getCacheStrategy(
  searchParams: URLSearchParams
): { shouldCache: boolean; ttl: number; cacheType: keyof typeof CacheControl } {
  // Don't cache if there are complex filters
  const hasComplexFilters = searchParams.has('search') || searchParams.has('filter')
  
  // Don't cache authenticated requests
  const isAuthenticated = searchParams.has('userId') || searchParams.has('token')
  
  if (isAuthenticated) {
    return { shouldCache: false, ttl: 0, cacheType: 'NO_CACHE' }
  }
  
  if (hasComplexFilters) {
    return { shouldCache: true, ttl: 120000, cacheType: 'DYNAMIC' } // 2 minutes
  }
  
  // Default to semi-static caching
  return { shouldCache: true, ttl: 300000, cacheType: 'SEMI_STATIC' } // 5 minutes
}

/**
 * Database query cache settings
 */
export const QueryCacheSettings = {
  // Events - cache for 5 minutes (events don't change that often)
  EVENTS: {
    ttl: 5 * 60 * 1000,
    pattern: 'events:',
  },
  
  // News - cache for 5 minutes (news updates periodically)
  NEWS: {
    ttl: 5 * 60 * 1000,
    pattern: 'news:',
  },
  
  // Businesses - cache for 10 minutes (business data is relatively stable)
  BUSINESSES: {
    ttl: 10 * 60 * 1000,
    pattern: 'businesses:',
  },
  
  // Jobs - cache for 5 minutes
  JOBS: {
    ttl: 5 * 60 * 1000,
    pattern: 'jobs:',
  },
  
  // Marketplace - cache for 2 minutes (more dynamic)
  MARKETPLACE: {
    ttl: 2 * 60 * 1000,
    pattern: 'marketplace:',
  },
  
  // Stats and aggregations - cache for 15 minutes
  STATS: {
    ttl: 15 * 60 * 1000,
    pattern: 'stats:',
  },
} as const
