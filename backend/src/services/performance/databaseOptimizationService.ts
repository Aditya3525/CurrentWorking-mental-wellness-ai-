import { PrismaClient } from '@prisma/client';

export interface QueryOptimizationConfig {
  enableQueryLogging: boolean;
  slowQueryThreshold: number; // ms
  maxConnectionPool: number;
  connectionTimeout: number; // ms
  enableQueryCache: boolean;
  batchSize: number;
}

export interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  averageExecutionTime: number;
  cacheHits: number;
  cacheMisses: number;
  connectionPoolUsage: number;
}

export interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  estimatedImprovement: number; // percentage
  recommendations: string[];
}

export class DatabaseOptimizationService {
  private config: QueryOptimizationConfig;
  private metrics: QueryMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    averageExecutionTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    connectionPoolUsage: 0
  };
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private queryLog: Array<{ query: string; duration: number; timestamp: Date; params?: any }> = [];

  constructor(config: QueryOptimizationConfig = {
    enableQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
    maxConnectionPool: 10,
    connectionTimeout: 5000,
    enableQueryCache: true,
    batchSize: 100
  }) {
    this.config = config;
  }

  /**
   * Optimize Prisma client configuration
   */
  getOptimizedPrismaConfig() {
    return {
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: this.config.enableQueryLogging ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
      ] : [],
      errorFormat: 'pretty',
      // Connection pool optimization
      connectionLimit: this.config.maxConnectionPool,
      idleTimeout: 60000, // 1 minute
      connectionTimeout: this.config.connectionTimeout
    };
  }

  /**
   * Wrap Prisma client with optimization middleware
   */
  optimizePrismaClient(prisma: PrismaClient) {
    // Add query logging middleware
    prisma.$use(async (params, next) => {
      const start = Date.now();
      
      try {
        // Check cache first
        if (this.config.enableQueryCache && this.isReadOperation(params.action)) {
          const cacheKey = this.generateCacheKey(params);
          const cached = this.getFromCache(cacheKey);
          
          if (cached) {
            this.metrics.cacheHits++;
            return cached;
          }
          
          this.metrics.cacheMisses++;
        }

        // Execute query
        const result = await next(params);
        const duration = Date.now() - start;

        // Update metrics
        this.updateQueryMetrics(duration, params);

        // Cache result for read operations
        if (this.config.enableQueryCache && this.isReadOperation(params.action)) {
          const cacheKey = this.generateCacheKey(params);
          this.setCache(cacheKey, result, this.getCacheTTL(params.model));
        }

        // Log slow queries
        if (duration > this.config.slowQueryThreshold) {
          this.logSlowQuery(params, duration);
        }

        return result;

      } catch (error) {
        const duration = Date.now() - start;
        this.updateQueryMetrics(duration, params);
        
        console.error('Database query error:', {
          model: params.model,
          action: params.action,
          duration,
          error: error.message
        });
        
        throw error;
      }
    });

    return prisma;
  }

  private isReadOperation(action: string): boolean {
    return ['findFirst', 'findMany', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(action);
  }

  private generateCacheKey(params: any): string {
    return `${params.model}_${params.action}_${JSON.stringify(params.args)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.queryCache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  private setCache(key: string, result: any, ttl: number): void {
    // Limit cache size
    if (this.queryCache.size >= 1000) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCacheTTL(model?: string): number {
    // Different TTL for different models
    const ttlMap: { [key: string]: number } = {
      'User': 300000, // 5 minutes
      'Content': 600000, // 10 minutes
      'Assessment': 900000, // 15 minutes
      'Practice': 1800000, // 30 minutes
      'default': 300000 // 5 minutes
    };

    return ttlMap[model || 'default'];
  }

  private updateQueryMetrics(duration: number, params: any): void {
    this.metrics.totalQueries++;
    
    if (duration > this.config.slowQueryThreshold) {
      this.metrics.slowQueries++;
    }

    // Update average execution time
    this.metrics.averageExecutionTime = 
      ((this.metrics.averageExecutionTime * (this.metrics.totalQueries - 1)) + duration) / 
      this.metrics.totalQueries;

    // Log query if enabled
    if (this.config.enableQueryLogging) {
      this.queryLog.push({
        query: `${params.model}.${params.action}`,
        duration,
        timestamp: new Date(),
        params: params.args
      });

      // Keep log size manageable
      if (this.queryLog.length > 1000) {
        this.queryLog = this.queryLog.slice(-500);
      }
    }
  }

  private logSlowQuery(params: any, duration: number): void {
    console.warn('Slow query detected:', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`,
      args: params.args,
      timestamp: new Date()
    });
  }

  /**
   * Analyze and optimize queries
   */
  analyzeQueries(): QueryOptimizationResult[] {
    const slowQueries = this.queryLog.filter(q => q.duration > this.config.slowQueryThreshold);
    const results: QueryOptimizationResult[] = [];

    for (const query of slowQueries) {
      const result = this.optimizeQuery(query);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  private optimizeQuery(queryInfo: any): QueryOptimizationResult | null {
    const recommendations: string[] = [];
    let estimatedImprovement = 0;

    // Analyze query patterns and suggest optimizations
    if (queryInfo.query.includes('findMany') && !queryInfo.params?.take) {
      recommendations.push('Add pagination (take/skip) to limit results');
      estimatedImprovement += 30;
    }

    if (queryInfo.params?.include && Object.keys(queryInfo.params.include).length > 3) {
      recommendations.push('Reduce the number of included relations');
      estimatedImprovement += 20;
    }

    if (queryInfo.params?.where && !this.hasIndexableFields(queryInfo.params.where)) {
      recommendations.push('Add database indexes for WHERE clause fields');
      estimatedImprovement += 50;
    }

    if (queryInfo.params?.orderBy && !this.hasIndexForSort(queryInfo.params.orderBy)) {
      recommendations.push('Add database index for ORDER BY field');
      estimatedImprovement += 25;
    }

    if (recommendations.length === 0) return null;

    return {
      originalQuery: queryInfo.query,
      optimizedQuery: this.generateOptimizedQuery(queryInfo, recommendations),
      estimatedImprovement: Math.min(estimatedImprovement, 80),
      recommendations
    };
  }

  private hasIndexableFields(where: any): boolean {
    // Check if WHERE clause uses indexed fields
    const indexedFields = ['id', 'email', 'userId', 'contentId', 'createdAt'];
    const whereFields = Object.keys(where);
    
    return whereFields.some(field => indexedFields.includes(field));
  }

  private hasIndexForSort(orderBy: any): boolean {
    // Check if ORDER BY field has an index
    const indexedFields = ['id', 'createdAt', 'updatedAt'];
    const sortFields = Object.keys(orderBy);
    
    return sortFields.some(field => indexedFields.includes(field));
  }

  private generateOptimizedQuery(queryInfo: any, recommendations: string[]): string {
    let optimized = queryInfo.query;

    // Generate example optimized query based on recommendations
    if (recommendations.includes('Add pagination (take/skip) to limit results')) {
      optimized += ' with pagination (take: 20, skip: 0)';
    }

    if (recommendations.includes('Reduce the number of included relations')) {
      optimized += ' with selective includes';
    }

    return optimized;
  }

  /**
   * Batch operations for better performance
   */
  async batchCreate<T>(model: string, data: T[], prisma: PrismaClient): Promise<any> {
    const batches = this.chunkArray(data, this.config.batchSize);
    const results = [];

    for (const batch of batches) {
      try {
        const result = await (prisma as any)[model].createMany({
          data: batch,
          skipDuplicates: true
        });
        results.push(result);
      } catch (error) {
        console.error(`Batch create error for ${model}:`, error);
        throw error;
      }
    }

    return results;
  }

  async batchUpdate<T>(
    model: string, 
    updates: Array<{ where: any; data: T }>, 
    prisma: PrismaClient
  ): Promise<any> {
    const results = [];

    // Use transaction for batch updates
    try {
      const result = await prisma.$transaction(
        updates.map(update => (prisma as any)[model].update(update))
      );
      results.push(...result);
    } catch (error) {
      console.error(`Batch update error for ${model}:`, error);
      throw error;
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get database performance metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent slow queries
   */
  getSlowQueries(limit: number = 10): any[] {
    return this.queryLog
      .filter(q => q.duration > this.config.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
    console.log('Database query cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      hitRate: this.metrics.totalQueries > 0 ? 
        (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0,
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses
    };
  }

  /**
   * Suggest database indexes
   */
  suggestIndexes(): string[] {
    const suggestions: string[] = [];
    const slowQueries = this.getSlowQueries(50);

    // Analyze patterns in slow queries
    const whereFields = new Map<string, number>();
    const orderByFields = new Map<string, number>();

    for (const query of slowQueries) {
      if (query.params?.where) {
        Object.keys(query.params.where).forEach(field => {
          whereFields.set(field, (whereFields.get(field) || 0) + 1);
        });
      }

      if (query.params?.orderBy) {
        Object.keys(query.params.orderBy).forEach(field => {
          orderByFields.set(field, (orderByFields.get(field) || 0) + 1);
        });
      }
    }

    // Suggest indexes for frequently used WHERE fields
    whereFields.forEach((count, field) => {
      if (count >= 5) {
        suggestions.push(`CREATE INDEX idx_${field} ON table_name (${field});`);
      }
    });

    // Suggest indexes for frequently used ORDER BY fields
    orderByFields.forEach((count, field) => {
      if (count >= 3) {
        suggestions.push(`CREATE INDEX idx_${field}_sort ON table_name (${field});`);
      }
    });

    return suggestions;
  }

  /**
   * Health check for database performance
   */
  async healthCheck(): Promise<{ status: string; metrics: any; recommendations: string[] }> {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];
    let status = 'healthy';

    // Check slow query ratio
    const slowQueryRatio = metrics.totalQueries > 0 ? 
      (metrics.slowQueries / metrics.totalQueries) * 100 : 0;

    if (slowQueryRatio > 10) {
      status = 'unhealthy';
      recommendations.push('High ratio of slow queries detected. Consider query optimization.');
    } else if (slowQueryRatio > 5) {
      status = 'warning';
      recommendations.push('Moderate number of slow queries. Monitor performance.');
    }

    // Check average execution time
    if (metrics.averageExecutionTime > 500) {
      status = 'unhealthy';
      recommendations.push('Average query execution time is high. Optimize queries and add indexes.');
    } else if (metrics.averageExecutionTime > 200) {
      status = 'warning';
      recommendations.push('Query execution time could be improved.');
    }

    // Check cache hit rate
    const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0 ?
      (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100 : 0;

    if (cacheHitRate < 50) {
      recommendations.push('Low cache hit rate. Consider adjusting cache TTL or query patterns.');
    }

    return {
      status,
      metrics: {
        ...metrics,
        slowQueryRatio: Math.round(slowQueryRatio * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100
      },
      recommendations
    };
  }
}

// Create singleton instance
export const dbOptimizationService = new DatabaseOptimizationService({
  enableQueryLogging: process.env.DB_QUERY_LOGGING !== 'false',
  slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'),
  maxConnectionPool: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  enableQueryCache: process.env.DB_QUERY_CACHE !== 'false',
  batchSize: parseInt(process.env.DB_BATCH_SIZE || '100')
});