/**
 * Simple in-memory cache with TTL (Time To Live) support
 * For production, consider using Redis for distributed caching
 */

interface CacheEntry<T> {
  data: T
  expires: number
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes default

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean up expired entries (garbage collection)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

// Export singleton instance
export const cache = new InMemoryCache()

// Cache TTL constants for different types of data
export const CACHE_TTL = {
  EVENTS: 10 * 60 * 1000,        // 10 minutes - events change frequently
  BUSINESSES: 30 * 60 * 1000,    // 30 minutes - businesses update less frequently
  NEWS: 5 * 60 * 1000,           // 5 minutes - news should be fresh
  JOBS: 15 * 60 * 1000,          // 15 minutes - job listings update moderately
  MARKETPLACE: 10 * 60 * 1000,   // 10 minutes - marketplace items change frequently
  HEALTH: 60 * 1000,             // 1 minute - health checks should be recent
  STATS: 5 * 60 * 1000,          // 5 minutes - statistics can be slightly stale
} as const

/**
 * Generate cache key with consistent formatting
 */
export function generateCacheKey(prefix: string, ...params: (string | number | boolean | undefined)[]): string {
  const cleanParams = params
    .filter(p => p !== undefined && p !== null)
    .map(p => String(p))
    .join(':')
  
  return cleanParams ? `${prefix}:${cleanParams}` : prefix
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()
  
  // Cache the result
  cache.set(key, data, ttlMs)
  
  return data
}

// Automatic cleanup every 10 minutes
setInterval(() => {
  cache.cleanup()
}, 10 * 60 * 1000)

export default cache