import { describe, test, expect, beforeEach } from '@jest/globals'
import cache, { generateCacheKey, CacheTTL } from '../src/lib/cache'

/**
 * Cache Utility Tests
 * 
 * Tests the in-memory caching utility to ensure proper functionality
 * for storing, retrieving, and invalidating cached data.
 */

describe('Cache Utility Tests', () => {
  
  beforeEach(() => {
    // Clear cache before each test
    cache.clear()
  })

  describe('Basic Cache Operations', () => {
    test('should set and get cache values', () => {
      const key = 'test:key'
      const value = { data: 'test data' }
      
      cache.set(key, value)
      const retrieved = cache.get(key)
      
      expect(retrieved).toEqual(value)
    })

    test('should return null for non-existent keys', () => {
      const retrieved = cache.get('non:existent:key')
      expect(retrieved).toBeNull()
    })

    test('should delete specific cache keys', () => {
      const key = 'test:key'
      cache.set(key, { data: 'test' })
      
      const deleted = cache.delete(key)
      expect(deleted).toBe(true)
      
      const retrieved = cache.get(key)
      expect(retrieved).toBeNull()
    })

    test('should clear all cache entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      cache.clear()
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key3')).toBeNull()
    })
  })

  describe('TTL and Expiration', () => {
    test('should expire cache entries after TTL', async () => {
      const key = 'test:expiring:key'
      const value = 'test value'
      const ttl = 100 // 100ms
      
      cache.set(key, value, ttl)
      
      // Should exist immediately
      expect(cache.get(key)).toBe(value)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be null after expiration
      expect(cache.get(key)).toBeNull()
    })

    test('should not expire before TTL', async () => {
      const key = 'test:not:expiring'
      const value = 'persistent value'
      const ttl = 500 // 500ms
      
      cache.set(key, value, ttl)
      
      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Should still exist
      expect(cache.get(key)).toBe(value)
    })

    test('should use default TTL if not specified', () => {
      const key = 'test:default:ttl'
      cache.set(key, 'value')
      
      // Should exist with default TTL
      expect(cache.get(key)).toBe('value')
    })
  })

  describe('Pattern-Based Invalidation', () => {
    test('should clear entries matching a pattern', () => {
      cache.set('api:events:limit:10', 'events1')
      cache.set('api:events:limit:20', 'events2')
      cache.set('api:news:limit:10', 'news1')
      cache.set('api:businesses:page:1', 'businesses1')
      
      // Clear only events entries
      const cleared = cache.clearPattern('^api:events:')
      
      expect(cleared).toBe(2)
      expect(cache.get('api:events:limit:10')).toBeNull()
      expect(cache.get('api:events:limit:20')).toBeNull()
      expect(cache.get('api:news:limit:10')).toBe('news1')
      expect(cache.get('api:businesses:page:1')).toBe('businesses1')
    })

    test('should clear all entries with wildcard pattern', () => {
      cache.set('api:events:1', 'data1')
      cache.set('api:news:1', 'data2')
      cache.set('api:jobs:1', 'data3')
      
      const cleared = cache.clearPattern('api:')
      
      expect(cleared).toBe(3)
      expect(cache.get('api:events:1')).toBeNull()
      expect(cache.get('api:news:1')).toBeNull()
      expect(cache.get('api:jobs:1')).toBeNull()
    })

    test('should return 0 when no entries match pattern', () => {
      cache.set('api:events:1', 'data1')
      
      const cleared = cache.clearPattern('api:nonexistent:')
      
      expect(cleared).toBe(0)
      expect(cache.get('api:events:1')).toBe('data1')
    })
  })

  describe('Cache Statistics', () => {
    test('should provide accurate cache statistics', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      const stats = cache.getStats()
      
      expect(stats.totalEntries).toBe(3)
      expect(stats.validEntries).toBe(3)
      expect(stats.expiredEntries).toBe(0)
      expect(stats.memoryUsage).toBeGreaterThan(0)
    })

    test('should track expired entries in stats', async () => {
      cache.set('key1', 'value1', 100) // Will expire
      cache.set('key2', 'value2', 10000) // Won't expire soon
      
      // Wait for first key to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const stats = cache.getStats()
      
      expect(stats.totalEntries).toBe(2)
      expect(stats.expiredEntries).toBe(1)
      expect(stats.validEntries).toBe(1)
    })
  })

  describe('Cache Cleanup', () => {
    test('should remove expired entries on cleanup', async () => {
      cache.set('key1', 'value1', 100)
      cache.set('key2', 'value2', 100)
      cache.set('key3', 'value3', 10000)
      
      // Wait for first two to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const cleaned = cache.cleanup()
      
      expect(cleaned).toBe(2)
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key3')).toBe('value3')
    })

    test('should return 0 when no entries need cleanup', () => {
      cache.set('key1', 'value1', 10000)
      cache.set('key2', 'value2', 10000)
      
      const cleaned = cache.cleanup()
      
      expect(cleaned).toBe(0)
    })
  })

  describe('generateCacheKey Function', () => {
    test('should generate consistent cache keys', () => {
      const params1 = { limit: 10, category: 'sports' }
      const params2 = { category: 'sports', limit: 10 }
      
      const key1 = generateCacheKey('api:events', params1)
      const key2 = generateCacheKey('api:events', params2)
      
      expect(key1).toBe(key2)
    })

    test('should include all parameters in cache key', () => {
      const params = { limit: 10, category: 'sports', featured: true }
      const key = generateCacheKey('api:events', params)
      
      expect(key).toContain('limit:10')
      expect(key).toContain('category:sports')
      expect(key).toContain('featured:true')
    })

    test('should handle empty parameters', () => {
      const key = generateCacheKey('api:events', {})
      expect(key).toBe('api:events:')
    })

    test('should handle boolean and number values', () => {
      const params = { 
        limit: 100, 
        featured: false, 
        page: 1 
      }
      const key = generateCacheKey('api:test', params)
      
      expect(key).toContain('limit:100')
      expect(key).toContain('featured:false')
      expect(key).toContain('page:1')
    })
  })

  describe('CacheTTL Constants', () => {
    test('should have defined TTL constants', () => {
      expect(CacheTTL.STATIC).toBe(60 * 60 * 1000) // 1 hour
      expect(CacheTTL.DYNAMIC).toBe(5 * 60 * 1000) // 5 minutes
      expect(CacheTTL.FREQUENT).toBe(2 * 60 * 1000) // 2 minutes
      expect(CacheTTL.REALTIME).toBe(30 * 1000) // 30 seconds
    })
  })

  describe('Complex Data Types', () => {
    test('should cache and retrieve arrays', () => {
      const key = 'test:array'
      const value = [1, 2, 3, 4, 5]
      
      cache.set(key, value)
      const retrieved = cache.get(key)
      
      expect(retrieved).toEqual(value)
    })

    test('should cache and retrieve nested objects', () => {
      const key = 'test:nested'
      const value = {
        user: {
          id: '123',
          profile: {
            name: 'Test User',
            settings: {
              notifications: true
            }
          }
        }
      }
      
      cache.set(key, value)
      const retrieved = cache.get(key)
      
      expect(retrieved).toEqual(value)
    })

    test('should cache and retrieve null values', () => {
      const key = 'test:null'
      const value = { data: null }
      
      cache.set(key, value)
      const retrieved = cache.get(key)
      
      expect(retrieved).toEqual(value)
    })
  })

  describe('Edge Cases', () => {
    test('should handle rapid cache operations', () => {
      const iterations = 1000
      
      for (let i = 0; i < iterations; i++) {
        cache.set(`key:${i}`, `value:${i}`)
      }
      
      const stats = cache.getStats()
      expect(stats.totalEntries).toBe(iterations)
      
      // Verify some random entries
      expect(cache.get('key:0')).toBe('value:0')
      expect(cache.get('key:500')).toBe('value:500')
      expect(cache.get('key:999')).toBe('value:999')
    })

    test('should handle special characters in keys', () => {
      const key = 'test:key:with:colons:and-dashes'
      const value = 'special key value'
      
      cache.set(key, value)
      expect(cache.get(key)).toBe(value)
    })

    test('should overwrite existing cache entries', () => {
      const key = 'test:overwrite'
      
      cache.set(key, 'first value')
      expect(cache.get(key)).toBe('first value')
      
      cache.set(key, 'second value')
      expect(cache.get(key)).toBe('second value')
    })
  })
})
