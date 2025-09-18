import { Request, Response } from 'express';
import { performanceMonitoringService } from '../services/performance/performanceMonitoringService';
import { cacheService } from '../services/performance/cacheService';
import { compressionService } from '../services/performance/compressionService';
import { dbOptimizationService } from '../services/performance/databaseOptimizationService';
import { cdnService } from '../services/performance/cdnService';
import { errorTrackingService } from '../services/analytics/errorTrackingService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export class PerformanceController {
  /**
   * Get comprehensive performance overview
   */
  async getPerformanceOverview(req: AuthenticatedRequest, res: Response) {
    try {
      // Check admin access
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [
        systemHealth,
        performanceStats,
        cacheStats,
        compressionStats,
        dbStats,
        cdnStats
      ] = await Promise.all([
        performanceMonitoringService.getSystemHealth(),
        performanceMonitoringService.getPerformanceStats(24),
        cacheService.getCacheStats(),
        compressionService.getMetrics(),
        dbOptimizationService.getMetrics(),
        cdnService.getCacheStats()
      ]);

      res.json({
        success: true,
        data: {
          systemHealth,
          performanceStats,
          services: {
            cache: cacheStats,
            compression: compressionStats,
            database: dbStats,
            cdn: cdnStats
          },
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to fetch performance overview' });
    }
  }

  /**
   * Get performance metrics for specific time range
   */
  async getPerformanceMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { startDate, endDate, hours = 24 } = req.query;
      
      let metrics;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        metrics = performanceMonitoringService.getMetricsInRange(start, end);
      } else {
        metrics = performanceMonitoringService.getPerformanceStats(Number(hours));
      }

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  }

  /**
   * Get cache performance
   */
  async getCachePerformance(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [cacheMetrics, cacheStats, cacheHealth] = await Promise.all([
        cacheService.getMetrics(),
        cacheService.getCacheStats(),
        cacheService.healthCheck()
      ]);

      res.json({
        success: true,
        data: {
          metrics: cacheMetrics,
          stats: cacheStats,
          health: cacheHealth
        }
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to fetch cache performance' });
    }
  }

  /**
   * Get database performance
   */
  async getDatabasePerformance(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [dbMetrics, slowQueries, dbHealth, indexSuggestions] = await Promise.all([
        dbOptimizationService.getMetrics(),
        dbOptimizationService.getSlowQueries(10),
        dbOptimizationService.healthCheck(),
        dbOptimizationService.suggestIndexes()
      ]);

      res.json({
        success: true,
        data: {
          metrics: dbMetrics,
          slowQueries,
          health: dbHealth,
          indexSuggestions
        }
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to fetch database performance' });
    }
  }

  /**
   * Get CDN performance
   */
  async getCDNPerformance(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [cdnMetrics, cdnStats, cdnHealth] = await Promise.all([
        cdnService.getMetrics(),
        cdnService.getCacheStats(),
        cdnService.healthCheck()
      ]);

      res.json({
        success: true,
        data: {
          metrics: cdnMetrics,
          stats: cdnStats,
          health: cdnHealth
        }
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to fetch CDN performance' });
    }
  }

  /**
   * Get compression metrics
   */
  async getCompressionMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const metrics = compressionService.getMetrics();
      const config = compressionService.getConfig();

      res.json({
        success: true,
        data: {
          metrics,
          config
        }
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to fetch compression metrics' });
    }
  }

  /**
   * Clear cache
   */
  async clearCache(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { type = 'all' } = req.body;

      switch (type) {
        case 'memory':
          await cacheService.clear();
          break;
        case 'database':
          dbOptimizationService.clearCache();
          break;
        case 'cdn':
          cdnService.clearCache();
          break;
        case 'all':
        default:
          await Promise.all([
            cacheService.clear(),
            dbOptimizationService.clearCache(),
            cdnService.clearCache()
          ]);
          break;
      }

      res.json({
        success: true,
        message: `${type} cache cleared successfully`
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }

  /**
   * Optimize performance
   */
  async optimizePerformance(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const optimizations = await performanceMonitoringService.optimizePerformance();

      res.json({
        success: true,
        data: {
          optimizations,
          message: 'Performance optimization completed'
        }
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to optimize performance' });
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { hours = 24, format = 'json' } = req.query;
      const report = performanceMonitoringService.generatePerformanceReport(Number(hours));

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="performance-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(this.convertReportToCSV(report));
      } else {
        res.json({
          success: true,
          data: report
        });
      }

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to generate performance report' });
    }
  }

  /**
   * Get optimization suggestions
   */
  async getOptimizationSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const suggestions = performanceMonitoringService.getOptimizationSuggestions();
      const systemHealth = await performanceMonitoringService.getSystemHealth();

      res.json({
        success: true,
        data: {
          suggestions,
          systemHealth: systemHealth.recommendations
        }
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to fetch optimization suggestions' });
    }
  }

  /**
   * Preload critical assets
   */
  async preloadAssets(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { assetPaths } = req.body;

      if (!assetPaths || !Array.isArray(assetPaths)) {
        return res.status(400).json({ error: 'Asset paths array is required' });
      }

      await cdnService.preloadAssets(assetPaths);

      res.json({
        success: true,
        message: `Preloaded ${assetPaths.length} assets`
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to preload assets' });
    }
  }

  /**
   * Update performance configuration
   */
  async updateConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { service, config } = req.body;

      switch (service) {
        case 'compression':
          compressionService.updateConfig(config);
          break;
        default:
          return res.status(400).json({ error: 'Invalid service specified' });
      }

      res.json({
        success: true,
        message: `${service} configuration updated`
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }

  /**
   * Get real-time performance metrics
   */
  async getRealtimeMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send initial data
      const initialData = {
        currentMetrics: performanceMonitoringService.getCurrentMetrics(),
        systemHealth: await performanceMonitoringService.getSystemHealth()
      };
      res.write(`data: ${JSON.stringify(initialData)}\n\n`);

      // Send updates every 30 seconds
      const interval = setInterval(async () => {
        try {
          const data = {
            currentMetrics: performanceMonitoringService.getCurrentMetrics(),
            systemHealth: await performanceMonitoringService.getSystemHealth(),
            timestamp: new Date()
          };
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.error('Error sending real-time performance data:', error);
        }
      }, 30000);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(interval);
      });

    } catch (error) {
      await errorTrackingService.logError(error as Error, {
        userId: req.user?.id,
        route: req.path,
        method: req.method
      });
      res.status(500).json({ error: 'Failed to start real-time metrics stream' });
    }
  }

  /**
   * Convert performance report to CSV format
   */
  private convertReportToCSV(report: any): string {
    const headers = [
      'Metric', 'Value', 'Unit', 'Status'
    ];

    const rows = [];
    
    if (report.performanceStats) {
      const stats = report.performanceStats;
      rows.push(['Average Response Time', stats.averageResponseTime, 'ms', 'info']);
      rows.push(['Max Response Time', stats.maxResponseTime, 'ms', 'info']);
      rows.push(['Average Memory Usage', stats.averageMemoryUsage, '%', 'info']);
      rows.push(['Max Memory Usage', stats.maxMemoryUsage, '%', 'info']);
      rows.push(['Average CPU Usage', stats.averageCpuUsage, '%', 'info']);
      rows.push(['Max CPU Usage', stats.maxCpuUsage, '%', 'info']);
      rows.push(['Average Error Rate', stats.averageErrorRate, '%', 'info']);
      rows.push(['Total Requests', stats.totalRequests, 'count', 'info']);
      rows.push(['Uptime', Math.floor(stats.uptime / 3600), 'hours', 'info']);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}

export const performanceController = new PerformanceController();