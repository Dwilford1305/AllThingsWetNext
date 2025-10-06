/**
 * In-Memory Cache Utility
 * 
 * Provides simple in-memory caching for API responses and database queries
 * to improve performance and reduce database load.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class CacheStore {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  /**
   * Set a value in the cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)
    
    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt
    })
  }

  /**
   * Get a value from the cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Delete a specific key from cache
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
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    
    return count
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now > (entry as CacheEntry<unknown>).expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: process.memoryUsage().heapUsed
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > (entry as CacheEntry<unknown>).expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// Singleton cache instance
const cache = new CacheStore()

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cache.cleanup()
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`)
    }
  }, 10 * 60 * 1000)
}

/**
 * Cache TTL constants for different data types
 */
export const CacheTTL = {
  STATIC: 60 * 60 * 1000, // 1 hour for static content
  DYNAMIC: 5 * 60 * 1000, // 5 minutes for dynamic content
  FREQUENT: 2 * 60 * 1000, // 2 minutes for frequently updated content
  REALTIME: 30 * 1000, // 30 seconds for near real-time data
} as const

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  
  return `${prefix}:${sortedParams}`
}

export default cache
