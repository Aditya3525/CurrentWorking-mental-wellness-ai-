import { Request, Response, NextFunction } from 'express';
import { cacheService } from './cacheService';
import { compressionService } from './compressionService';
import { dbOptimizationService } from './databaseOptimizationService';
import { cdnService } from './cdnService';

export interface PerformanceConfig {
  enableMonitoring: boolean;
  metricsRetention: number; // days
  alertThresholds: {
    responseTime: number; // ms
    memoryUsage: number; // percentage
    cpuUsage: number; // percentage
    errorRate: number; // percentage
  };
  samplingRate: number; // 0-1
}

export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  uptime: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  services: {
    cache: any;
    compression: any;
    database: any;
    cdn: any;
  };
  recommendations: string[];
}

export class PerformanceMonitoringService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private lastMinuteRequests = 0;
  private lastMinuteTimestamp = Date.now();
  private activeConnections = 0;

  constructor(config: PerformanceConfig = {
    enableMonitoring: true,
    metricsRetention: 7, // 7 days
    alertThresholds: {
      responseTime: 2000, // 2 seconds
      memoryUsage: 80, // 80%
      cpuUsage: 80, // 80%
      errorRate: 5 // 5%
    },
    samplingRate: 1.0 // Sample all requests
  }) {
    this.config = config;
    this.startMetricsCollection();
  }

  private startMetricsCollection() {
    if (!this.config.enableMonitoring) return;

    // Collect metrics every minute
    setInterval(() => {
      this.collectMetrics();
    }, 60000);

    // Clean old metrics daily
    setInterval(() => {
      this.cleanOldMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  private async collectMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = await this.getCpuUsage();
      
      // Calculate requests per second
      const now = Date.now();
      const timeDiff = (now - this.lastMinuteTimestamp) / 1000;
      const requestsPerSecond = timeDiff > 0 ? this.lastMinuteRequests / timeDiff : 0;
      
      // Calculate error rate
      const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

      const metric: PerformanceMetrics = {
        timestamp: new Date(),
        responseTime: this.calculateAverageResponseTime(),
        memoryUsage: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        cpuUsage,
        activeConnections: this.activeConnections,
        requestsPerSecond,
        errorRate,
        uptime: process.uptime()
      };

      this.metrics.push(metric);
      
      // Reset counters
      this.lastMinuteRequests = 0;
      this.lastMinuteTimestamp = now;

      // Check thresholds and alert if necessary
      await this.checkThresholds(metric);

    } catch (error) {
      console.error('Performance monitoring error:', error);
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        
        const userTime = endUsage.user / 1000; // Convert to milliseconds
        const systemTime = endUsage.system / 1000;
        const totalTime = endTime - startTime;
        
        const cpuPercent = ((userTime + systemTime) / totalTime) * 100;
        resolve(Math.min(cpuPercent, 100)); // Cap at 100%
      }, 100);
    });
  }

  private calculateAverageResponseTime(): number {
    // This would typically be calculated from request middleware
    // For now, return a placeholder
    return 150; // ms
  }

  private cleanOldMetrics() {
    const cutoffDate = new Date(Date.now() - this.config.metricsRetention * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoffDate);
  }

  private async checkThresholds(metric: PerformanceMetrics) {
    const alerts: string[] = [];

    if (metric.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push(`High response time: ${metric.responseTime}ms`);
    }

    if (metric.memoryUsage.percentage > this.config.alertThresholds.memoryUsage) {
      alerts.push(`High memory usage: ${metric.memoryUsage.percentage.toFixed(1)}%`);
    }

    if (metric.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${metric.cpuUsage.toFixed(1)}%`);
    }

    if (metric.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push(`High error rate: ${metric.errorRate.toFixed(1)}%`);
    }

    if (alerts.length > 0) {
      console.warn('Performance alerts:', alerts);
      // Here you would send alerts to monitoring systems
    }
  }

  /**
   * Express middleware for performance monitoring
   */
  monitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableMonitoring || Math.random() > this.config.samplingRate) {
        return next();
      }

      const startTime = Date.now();
      this.requestCount++;
      this.lastMinuteRequests++;
      this.activeConnections++;

      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const responseTime = Date.now() - startTime;
        
        // Track error responses
        if (res.statusCode >= 400) {
          this.errorCount++;
        }

        this.activeConnections--;
        
        // Log slow requests
        if (responseTime > this.config.alertThresholds.responseTime) {
          console.warn('Slow request detected:', {
            path: req.path,
            method: req.method,
            responseTime: `${responseTime}ms`,
            statusCode: res.statusCode
          });
        }

        originalEnd.apply(res, args);
      }.bind(this);

      next();
    };
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get metrics for a time range
   */
  getMetricsInRange(startDate: Date, endDate: Date): PerformanceMetrics[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startDate && metric.timestamp <= endDate
    );
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(hours: number = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(metric => metric.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) {
      return null;
    }

    const stats = {
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      averageMemoryUsage: 0,
      maxMemoryUsage: 0,
      averageCpuUsage: 0,
      maxCpuUsage: 0,
      totalRequests: recentMetrics.reduce((sum, m) => sum + m.requestsPerSecond, 0) * hours,
      averageErrorRate: 0,
      uptime: process.uptime()
    };

    for (const metric of recentMetrics) {
      stats.averageResponseTime += metric.responseTime;
      stats.maxResponseTime = Math.max(stats.maxResponseTime, metric.responseTime);
      stats.minResponseTime = Math.min(stats.minResponseTime, metric.responseTime);
      stats.averageMemoryUsage += metric.memoryUsage.percentage;
      stats.maxMemoryUsage = Math.max(stats.maxMemoryUsage, metric.memoryUsage.percentage);
      stats.averageCpuUsage += metric.cpuUsage;
      stats.maxCpuUsage = Math.max(stats.maxCpuUsage, metric.cpuUsage);
      stats.averageErrorRate += metric.errorRate;
    }

    const count = recentMetrics.length;
    stats.averageResponseTime /= count;
    stats.averageMemoryUsage /= count;
    stats.averageCpuUsage /= count;
    stats.averageErrorRate /= count;

    return {
      ...stats,
      averageResponseTime: Math.round(stats.averageResponseTime),
      averageMemoryUsage: Math.round(stats.averageMemoryUsage * 100) / 100,
      averageCpuUsage: Math.round(stats.averageCpuUsage * 100) / 100,
      averageErrorRate: Math.round(stats.averageErrorRate * 100) / 100
    };
  }

  /**
   * Get comprehensive system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [cacheHealth, dbHealth, cdnHealth] = await Promise.all([
      cacheService.healthCheck(),
      dbOptimizationService.healthCheck(),
      cdnService.healthCheck()
    ]);

    const compressionMetrics = compressionService.getMetrics();
    const currentMetrics = this.getCurrentMetrics();

    // Calculate overall health score
    let score = 100;
    const recommendations: string[] = [];

    // Deduct points for unhealthy services
    if (cacheHealth.status === 'unhealthy') score -= 20;
    else if (cacheHealth.status === 'degraded') score -= 10;

    if (dbHealth.status === 'unhealthy') score -= 30;
    else if (dbHealth.status === 'warning') score -= 15;

    if (cdnHealth.status === 'unhealthy') score -= 15;
    else if (cdnHealth.status === 'warning') score -= 7;

    // Check current performance metrics
    if (currentMetrics) {
      if (currentMetrics.memoryUsage.percentage > this.config.alertThresholds.memoryUsage) {
        score -= 10;
        recommendations.push('High memory usage detected');
      }

      if (currentMetrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
        score -= 10;
        recommendations.push('High CPU usage detected');
      }

      if (currentMetrics.errorRate > this.config.alertThresholds.errorRate) {
        score -= 15;
        recommendations.push('High error rate detected');
      }
    }

    // Check compression efficiency
    if (compressionMetrics.compressionRatio < 30) {
      score -= 5;
      recommendations.push('Low compression efficiency');
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 70) status = 'critical';
    else if (score < 85) status = 'warning';

    // Combine recommendations
    recommendations.push(...cacheHealth.recommendations || []);
    recommendations.push(...dbHealth.recommendations || []);
    recommendations.push(...cdnHealth.recommendations || []);

    return {
      status,
      score: Math.max(0, score),
      services: {
        cache: cacheHealth,
        compression: {
          status: compressionMetrics.compressionRatio > 30 ? 'healthy' : 'warning',
          metrics: compressionMetrics
        },
        database: dbHealth,
        cdn: cdnHealth
      },
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(hours: number = 24) {
    const stats = this.getPerformanceStats(hours);
    const systemHealth = this.getSystemHealth();

    return {
      reportPeriod: `${hours} hours`,
      generatedAt: new Date(),
      performanceStats: stats,
      systemHealth,
      recommendations: this.generateOptimizationRecommendations(stats)
    };
  }

  private generateOptimizationRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (!stats) return recommendations;

    if (stats.averageResponseTime > 1000) {
      recommendations.push('Consider implementing caching strategies to reduce response times');
      recommendations.push('Review database queries for optimization opportunities');
    }

    if (stats.averageMemoryUsage > 70) {
      recommendations.push('Monitor memory usage and consider increasing server resources');
      recommendations.push('Review application for memory leaks');
    }

    if (stats.averageCpuUsage > 70) {
      recommendations.push('Consider horizontal scaling or CPU optimization');
      recommendations.push('Review CPU-intensive operations');
    }

    if (stats.averageErrorRate > 2) {
      recommendations.push('Investigate and fix sources of errors');
      recommendations.push('Implement better error handling and monitoring');
    }

    return recommendations;
  }

  /**
   * Optimize performance based on metrics
   */
  async optimizePerformance() {
    console.log('Starting automatic performance optimization...');

    const systemHealth = await this.getSystemHealth();
    const optimizations: string[] = [];

    // Cache optimization
    if (systemHealth.services.cache.status !== 'healthy') {
      cacheService.clearCache();
      optimizations.push('Cache cleared and reset');
    }

    // Database optimization
    if (systemHealth.services.database.status !== 'healthy') {
      dbOptimizationService.clearCache();
      optimizations.push('Database query cache cleared');
    }

    // CDN optimization
    if (systemHealth.services.cdn.status !== 'healthy') {
      cdnService.clearCache();
      optimizations.push('CDN asset cache cleared');
    }

    // Memory cleanup
    const currentMetrics = this.getCurrentMetrics();
    if (currentMetrics && currentMetrics.memoryUsage.percentage > 80) {
      global.gc && global.gc();
      optimizations.push('Garbage collection triggered');
    }

    console.log('Performance optimization completed:', optimizations);
    return optimizations;
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions() {
    const suggestions = [
      {
        category: 'Caching',
        suggestions: [
          'Enable Redis for better cache performance',
          'Implement cache warming for critical data',
          'Use cache tags for efficient invalidation'
        ]
      },
      {
        category: 'Database',
        suggestions: [
          'Add database indexes for frequently queried fields',
          'Implement connection pooling',
          'Use read replicas for read-heavy operations'
        ]
      },
      {
        category: 'Assets',
        suggestions: [
          'Enable CDN for static assets',
          'Implement image optimization',
          'Use asset versioning for better caching'
        ]
      },
      {
        category: 'Server',
        suggestions: [
          'Enable gzip/brotli compression',
          'Implement rate limiting',
          'Use HTTP/2 for better performance'
        ]
      }
    ];

    return suggestions;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastMinuteRequests = 0;
    this.activeConnections = 0;
    console.log('Performance metrics reset');
  }
}

// Create singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService({
  enableMonitoring: process.env.PERFORMANCE_MONITORING !== 'false',
  metricsRetention: parseInt(process.env.METRICS_RETENTION_DAYS || '7'),
  alertThresholds: {
    responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '2000'),
    memoryUsage: parseInt(process.env.ALERT_MEMORY_USAGE || '80'),
    cpuUsage: parseInt(process.env.ALERT_CPU_USAGE || '80'),
    errorRate: parseInt(process.env.ALERT_ERROR_RATE || '5')
  },
  samplingRate: parseFloat(process.env.MONITORING_SAMPLING_RATE || '1.0')
});