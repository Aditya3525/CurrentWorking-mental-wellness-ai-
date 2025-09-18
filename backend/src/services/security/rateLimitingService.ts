import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  message: string;
}

export interface RateLimitRule {
  id: string;
  path: string;
  method?: string;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  message?: string;
  enabled: boolean;
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  blockRate: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topBlockedPaths: Array<{ path: string; count: number }>;
}

export class RateLimitingService {
  private config: RateLimitConfig;
  private customRules: RateLimitRule[] = [];
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    blockRate: 0,
    topBlockedIPs: [],
    topBlockedPaths: []
  };
  private blockedIPs = new Map<string, number>();
  private blockedPaths = new Map<string, number>();

  constructor(config: RateLimitConfig = {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
  }) {
    this.config = config;
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.customRules = [
      {
        id: 'auth-strict',
        path: '/api/auth/*',
        method: 'POST',
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 login attempts per 15 minutes
        message: 'Too many authentication attempts, please try again later.',
        enabled: true
      },
      {
        id: 'chat-moderate',
        path: '/api/chat/*',
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 chat messages per minute
        message: 'Chat rate limit exceeded, please slow down.',
        enabled: true
      },
      {
        id: 'upload-strict',
        path: '/api/upload/*',
        method: 'POST',
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20, // 20 uploads per hour
        message: 'Upload rate limit exceeded, please try again later.',
        enabled: true
      },
      {
        id: 'assessment-moderate',
        path: '/api/assessments/*',
        method: 'POST',
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 50, // 50 assessment submissions per hour
        message: 'Assessment submission rate limit exceeded.',
        enabled: true
      },
      {
        id: 'api-general',
        path: '/api/*',
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000, // 1000 API requests per 15 minutes
        message: 'API rate limit exceeded, please try again later.',
        enabled: true
      }
    ];
  }

  /**
   * Create general rate limiting middleware
   */
  createGeneralRateLimit() {
    if (!this.config.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return rateLimit({
      windowMs: this.config.windowMs,
      max: this.config.maxRequests,
      skipSuccessfulRequests: this.config.skipSuccessfulRequests,
      skipFailedRequests: this.config.skipFailedRequests,
      standardHeaders: this.config.standardHeaders,
      legacyHeaders: this.config.legacyHeaders,
      message: { error: this.config.message },
      handler: (req: Request, res: Response) => {
        this.trackBlockedRequest(req);
        res.status(429).json({ error: this.config.message });
      },
      onLimitReached: (req: Request) => {
        console.warn(`Rate limit reached for IP: ${req.ip}, Path: ${req.path}`);
      }
    });
  }

  /**
   * Create speed limiting middleware (slow down instead of block)
   */
  createSpeedLimit(delayMs: number = 500, maxDelayMs: number = 20000) {
    if (!this.config.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return slowDown({
      windowMs: this.config.windowMs,
      delayAfter: Math.floor(this.config.maxRequests * 0.5), // Start slowing after 50% of limit
      delayMs,
      maxDelayMs,
      skipSuccessfulRequests: this.config.skipSuccessfulRequests,
      skipFailedRequests: this.config.skipFailedRequests
    });
  }

  /**
   * Create custom rate limit for specific endpoints
   */
  createCustomRateLimit(ruleId: string) {
    const rule = this.customRules.find(r => r.id === ruleId);
    
    if (!rule || !rule.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return rateLimit({
      windowMs: rule.windowMs,
      max: rule.maxRequests,
      skipSuccessfulRequests: rule.skipSuccessfulRequests ?? this.config.skipSuccessfulRequests,
      message: { error: rule.message || this.config.message },
      handler: (req: Request, res: Response) => {
        this.trackBlockedRequest(req, ruleId);
        res.status(429).json({ error: rule.message || this.config.message });
      },
      skip: (req: Request) => {
        // Skip if method doesn't match (if specified)
        if (rule.method && req.method !== rule.method) {
          return true;
        }
        return false;
      }
    });
  }

  /**
   * Create progressive rate limiting (stricter limits for repeated violations)
   */
  createProgressiveRateLimit() {
    const violationCounts = new Map<string, number>();

    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      const ip = req.ip;
      const violations = violationCounts.get(ip) || 0;
      
      // Adjust limits based on violation history
      let maxRequests = this.config.maxRequests;
      let windowMs = this.config.windowMs;

      if (violations > 3) {
        maxRequests = Math.floor(maxRequests * 0.1); // 10% of normal limit
        windowMs = windowMs * 4; // 4x longer window
      } else if (violations > 1) {
        maxRequests = Math.floor(maxRequests * 0.5); // 50% of normal limit
        windowMs = windowMs * 2; // 2x longer window
      }

      const limiter = rateLimit({
        windowMs,
        max: maxRequests,
        message: { error: 'Rate limit exceeded. Repeated violations result in stricter limits.' },
        handler: (req: Request, res: Response) => {
          // Increment violation count
          violationCounts.set(ip, violations + 1);
          this.trackBlockedRequest(req, 'progressive');
          
          res.status(429).json({
            error: 'Rate limit exceeded. Repeated violations result in stricter limits.',
            violations: violations + 1,
            nextResetTime: new Date(Date.now() + windowMs)
          });
        }
      });

      limiter(req, res, next);
    };
  }

  /**
   * Create distributed rate limiting (for load-balanced environments)
   */
  createDistributedRateLimit(redisClient?: any) {
    if (!redisClient || !this.config.enabled) {
      return this.createGeneralRateLimit();
    }

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = `rate_limit:${req.ip}:${Math.floor(Date.now() / this.config.windowMs)}`;
        const current = await redisClient.incr(key);
        
        if (current === 1) {
          await redisClient.expire(key, Math.ceil(this.config.windowMs / 1000));
        }

        if (current > this.config.maxRequests) {
          this.trackBlockedRequest(req, 'distributed');
          return res.status(429).json({ error: this.config.message });
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - current));
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + this.config.windowMs));

        next();
      } catch (error) {
        console.error('Distributed rate limiting error:', error);
        // Fallback to memory-based rate limiting
        this.createGeneralRateLimit()(req, res, next);
      }
    };
  }

  /**
   * Track blocked requests for metrics
   */
  private trackBlockedRequest(req: Request, ruleId?: string) {
    this.metrics.totalRequests++;
    this.metrics.blockedRequests++;
    this.metrics.blockRate = (this.metrics.blockedRequests / this.metrics.totalRequests) * 100;

    // Track by IP
    const ipCount = this.blockedIPs.get(req.ip) || 0;
    this.blockedIPs.set(req.ip, ipCount + 1);

    // Track by path
    const pathCount = this.blockedPaths.get(req.path) || 0;
    this.blockedPaths.set(req.path, pathCount + 1);

    // Update top blocked lists
    this.updateTopBlocked();

    // Log security event
    console.warn('Rate limit violation:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ruleId,
      timestamp: new Date()
    });
  }

  private updateTopBlocked() {
    // Update top blocked IPs
    this.metrics.topBlockedIPs = Array.from(this.blockedIPs.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Update top blocked paths
    this.metrics.topBlockedPaths = Array.from(this.blockedPaths.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
  }

  /**
   * Add custom rate limiting rule
   */
  addCustomRule(rule: Omit<RateLimitRule, 'id'>) {
    const newRule: RateLimitRule = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...rule
    };
    this.customRules.push(newRule);
    return newRule;
  }

  /**
   * Update existing rule
   */
  updateRule(ruleId: string, updates: Partial<RateLimitRule>) {
    const ruleIndex = this.customRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.customRules[ruleIndex] = { ...this.customRules[ruleIndex], ...updates };
      return this.customRules[ruleIndex];
    }
    return null;
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): boolean {
    const ruleIndex = this.customRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.customRules.splice(ruleIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): RateLimitRule[] {
    return [...this.customRules];
  }

  /**
   * Get rate limiting metrics
   */
  getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      blockRate: 0,
      topBlockedIPs: [],
      topBlockedPaths: []
    };
    this.blockedIPs.clear();
    this.blockedPaths.clear();
  }

  /**
   * Whitelist IP address
   */
  createIPWhitelist(whitelist: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (whitelist.includes(req.ip)) {
        return next();
      }
      next();
    };
  }

  /**
   * Blacklist IP address
   */
  createIPBlacklist(blacklist: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (blacklist.includes(req.ip)) {
        this.trackBlockedRequest(req, 'blacklist');
        return res.status(403).json({ error: 'Access denied from this IP address' });
      }
      next();
    };
  }

  /**
   * Create adaptive rate limiting based on server load
   */
  createAdaptiveRateLimit(getServerLoad: () => number) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      const serverLoad = getServerLoad(); // Expected to return 0-100
      let adjustedMaxRequests = this.config.maxRequests;

      // Reduce limits based on server load
      if (serverLoad > 80) {
        adjustedMaxRequests = Math.floor(this.config.maxRequests * 0.3); // 30% of normal limit
      } else if (serverLoad > 60) {
        adjustedMaxRequests = Math.floor(this.config.maxRequests * 0.5); // 50% of normal limit
      } else if (serverLoad > 40) {
        adjustedMaxRequests = Math.floor(this.config.maxRequests * 0.7); // 70% of normal limit
      }

      const limiter = rateLimit({
        windowMs: this.config.windowMs,
        max: adjustedMaxRequests,
        message: { 
          error: 'Server is under high load. Please try again later.',
          serverLoad,
          retryAfter: this.config.windowMs / 1000
        },
        handler: (req: Request, res: Response) => {
          this.trackBlockedRequest(req, 'adaptive');
          res.status(429).json({
            error: 'Server is under high load. Please try again later.',
            serverLoad,
            retryAfter: this.config.windowMs / 1000
          });
        }
      });

      limiter(req, res, next);
    };
  }

  /**
   * Health check for rate limiting service
   */
  healthCheck() {
    const metrics = this.getMetrics();
    let status = 'healthy';
    const recommendations: string[] = [];

    if (metrics.blockRate > 20) {
      status = 'warning';
      recommendations.push('High block rate detected. Consider adjusting rate limits or investigating suspicious activity.');
    }

    if (metrics.topBlockedIPs.length > 0 && metrics.topBlockedIPs[0].count > 100) {
      status = 'warning';
      recommendations.push('Potential abuse detected from specific IP addresses. Consider implementing IP blacklisting.');
    }

    return {
      status,
      metrics,
      recommendations,
      rulesCount: this.customRules.length,
      enabled: this.config.enabled
    };
  }
}

// Create singleton instance
export const rateLimitingService = new RateLimitingService({
  enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
  skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true',
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});