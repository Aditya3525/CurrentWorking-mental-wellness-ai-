import NodeCache from 'node-cache';
import Redis from 'ioredis';

export interface CacheConfig {
  strategy: 'memory' | 'redis' | 'hybrid';
  memoryTtl: number; // seconds
  redisTtl: number; // seconds
  maxMemoryKeys: number;
  redisUrl?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

export class CacheService {
  private memoryCache: NodeCache;
  private redisClient?: Redis;
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  };

  constructor(config: CacheConfig = {
    strategy: 'memory',
    memoryTtl: 3600, // 1 hour
    redisTtl: 86400, // 24 hours
    maxMemoryKeys: 1000
  }) {
    this.config = config;
    this.memoryCache = new NodeCache({
      stdTTL: config.memoryTtl,
      maxKeys: config.maxMemoryKeys,
      checkperiod: 600 // Check for expired keys every 10 minutes
    });

    // Initialize Redis if configured
    if (config.strategy === 'redis' || config.strategy === 'hybrid') {
      this.initializeRedis();
    }

    // Setup cache event listeners
    this.setupEventListeners();
  }

  private async initializeRedis() {
    try {
      const redisUrl = this.config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redisClient.on('connect', () => {
        console.log('Cache: Redis connected successfully');
      });

      this.redisClient.on('error', (error) => {
        console.error('Cache: Redis connection error:', error);
        // Fallback to memory cache only
        this.config.strategy = 'memory';
      });

      // Test connection
      await this.redisClient.ping();
    } catch (error) {
      console.error('Cache: Failed to initialize Redis, falling back to memory cache:', error);
      this.config.strategy = 'memory';
    }
  }

  private setupEventListeners() {
    this.memoryCache.on('set', () => {
      this.metrics.sets++;
      this.updateHitRate();
    });

    this.memoryCache.on('del', () => {
      this.metrics.deletes++;
    });

    this.memoryCache.on('expired', (key) => {
      console.log(`Cache: Memory cache key expired: ${key}`);
    });
  }

  private updateHitRate() {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try memory cache first (fastest)
      if (this.config.strategy === 'memory' || this.config.strategy === 'hybrid') {
        const memoryValue = this.memoryCache.get<T>(key);
        if (memoryValue !== undefined) {
          this.metrics.hits++;
          this.updateHitRate();
          return memoryValue;
        }
      }

      // Try Redis if configured and memory cache missed
      if ((this.config.strategy === 'redis' || this.config.strategy === 'hybrid') && this.redisClient) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue !== null) {
          const parsedValue = JSON.parse(redisValue);
          
          // Store in memory cache for faster future access
          if (this.config.strategy === 'hybrid') {
            this.memoryCache.set(key, parsedValue, this.config.memoryTtl);
          }
          
          this.metrics.hits++;
          this.updateHitRate();
          return parsedValue;
        }
      }

      this.metrics.misses++;
      this.updateHitRate();
      return null;

    } catch (error) {
      console.error('Cache: Error getting value:', error);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const memoryTtl = ttl || this.config.memoryTtl;
      const redisTtl = ttl || this.config.redisTtl;

      // Set in memory cache
      if (this.config.strategy === 'memory' || this.config.strategy === 'hybrid') {
        this.memoryCache.set(key, value, memoryTtl);
      }

      // Set in Redis
      if ((this.config.strategy === 'redis' || this.config.strategy === 'hybrid') && this.redisClient) {
        await this.redisClient.setex(key, redisTtl, JSON.stringify(value));
      }

      this.metrics.sets++;
      return true;

    } catch (error) {
      console.error('Cache: Error setting value:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Delete from memory cache
      if (this.config.strategy === 'memory' || this.config.strategy === 'hybrid') {
        deleted = this.memoryCache.del(key) > 0;
      }

      // Delete from Redis
      if ((this.config.strategy === 'redis' || this.config.strategy === 'hybrid') && this.redisClient) {
        const redisDeleted = await this.redisClient.del(key);
        deleted = deleted || redisDeleted > 0;
      }

      if (deleted) {
        this.metrics.deletes++;
      }

      return deleted;

    } catch (error) {
      console.error('Cache: Error deleting value:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      if (this.config.strategy === 'memory' || this.config.strategy === 'hybrid') {
        this.memoryCache.flushAll();
      }

      // Clear Redis
      if ((this.config.strategy === 'redis' || this.config.strategy === 'hybrid') && this.redisClient) {
        await this.redisClient.flushdb();
      }

      console.log('Cache: All cache entries cleared');

    } catch (error) {
      console.error('Cache: Error clearing cache:', error);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    
    return {
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        ksize: memoryStats.ksize,
        vsize: memoryStats.vsize
      },
      combined: this.metrics,
      config: this.config
    };
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    const status = {
      memory: 'healthy',
      redis: 'healthy'
    };

    // Check memory cache
    try {
      const testKey = `health_check_${Date.now()}`;
      this.memoryCache.set(testKey, 'test', 1);
      const value = this.memoryCache.get(testKey);
      if (value !== 'test') {
        status.memory = 'unhealthy';
      }
      this.memoryCache.del(testKey);
    } catch (error) {
      status.memory = 'unhealthy';
    }

    // Check Redis if configured
    if (this.redisClient) {
      try {
        await this.redisClient.ping();
      } catch (error) {
        status.redis = 'unhealthy';
      }
    }

    // Determine overall health
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (status.memory === 'unhealthy' && status.redis === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (status.memory === 'unhealthy' || status.redis === 'unhealthy') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      details: status
    };
  }

  /**
   * Get or set pattern with function execution
   */
  async getOrSet<T>(
    key: string, 
    fn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn();
      await this.set(key, result, ttl);
      return result;
    } catch (error) {
      console.error(`Cache: Error executing function for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Cache with tags for grouped invalidation
   */
  async setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): Promise<boolean> {
    const success = await this.set(key, value, ttl);
    
    if (success) {
      // Store tag associations
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        let taggedKeys = await this.get<string[]>(tagKey) || [];
        
        if (!taggedKeys.includes(key)) {
          taggedKeys.push(key);
          await this.set(tagKey, taggedKeys, ttl);
        }
      }
    }

    return success;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    const tagKey = `tag:${tag}`;
    const taggedKeys = await this.get<string[]>(tagKey) || [];
    
    let deletedCount = 0;
    for (const key of taggedKeys) {
      const deleted = await this.delete(key);
      if (deleted) deletedCount++;
    }

    // Clear the tag key itself
    await this.delete(tagKey);

    return deletedCount;
  }

  /**
   * Warm up cache with common data
   */
  async warmUp(warmUpFunctions: Array<{ key: string; fn: () => Promise<any>; ttl?: number }>) {
    console.log('Cache: Starting cache warm-up...');
    
    const results = await Promise.allSettled(
      warmUpFunctions.map(async ({ key, fn, ttl }) => {
        try {
          const value = await fn();
          await this.set(key, value, ttl);
          return { key, success: true };
        } catch (error) {
          console.error(`Cache: Failed to warm up key ${key}:`, error);
          return { key, success: false, error };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`Cache: Warm-up completed. ${successful}/${warmUpFunctions.length} keys loaded.`);
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    try {
      this.memoryCache.close();
      
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      
      console.log('Cache: All connections closed');
    } catch (error) {
      console.error('Cache: Error closing connections:', error);
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService({
  strategy: process.env.CACHE_STRATEGY as 'memory' | 'redis' | 'hybrid' || 'memory',
  memoryTtl: parseInt(process.env.CACHE_MEMORY_TTL || '3600'),
  redisTtl: parseInt(process.env.CACHE_REDIS_TTL || '86400'),
  maxMemoryKeys: parseInt(process.env.CACHE_MAX_MEMORY_KEYS || '1000'),
  redisUrl: process.env.REDIS_URL
});