import { Request, Response, NextFunction } from 'express';
import { rateLimitingService } from './rateLimitingService';
import { fileUploadSecurityService } from './fileUploadSecurityService';
import { csrfProtectionService } from './csrfProtectionService';
import { inputValidationService } from './inputValidationService';

export interface SecurityMetrics {
  rateLimiting: {
    totalRequests: number;
    blockedRequests: number;
    suspiciousIPs: string[];
    blockedPaths: string[];
  };
  fileUpload: {
    totalUploads: number;
    threatFiles: number;
    quarantinedFiles: number;
    detectedThreats: string[];
  };
  csrf: {
    tokenGenerated: number;
    tokenValidated: number;
    validationFailures: number;
    cspViolations: number;
  };
  inputValidation: {
    totalValidations: number;
    validationFailures: number;
    blockedXSSAttempts: number;
    blockedSQLInjections: number;
  };
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'rate_limit' | 'file_threat' | 'csrf_attack' | 'xss_attempt' | 'sql_injection' | 'validation_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string; // IP address or identifier
  details: any;
  action: 'blocked' | 'allowed' | 'quarantined' | 'sanitized';
  endpoint?: string;
  userAgent?: string;
}

export interface SecurityConfiguration {
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    max: number;
    message: string;
  };
  fileUpload: {
    enabled: boolean;
    maxFileSize: number;
    allowedMimeTypes: string[];
    scanEnabled: boolean;
  };
  csrf: {
    enabled: boolean;
    secret: string;
    sameSite: 'strict' | 'lax' | 'none';
    secure: boolean;
  };
  inputValidation: {
    enabled: boolean;
    sanitizationEnabled: boolean;
    xssProtection: boolean;
    sqlInjectionProtection: boolean;
  };
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      suspiciousIPs: number;
      blockedRequests: number;
      threatFiles: number;
      cspViolations: number;
    };
  };
}

export class SecurityService {
  private events: SecurityEvent[] = [];
  private config: SecurityConfiguration;
  private alertCallbacks: ((event: SecurityEvent) => void)[] = [];

  constructor(config: Partial<SecurityConfiguration> = {}) {
    this.config = {
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: 'Too many requests from this IP',
        ...config.rateLimiting
      },
      fileUpload: {
        enabled: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
        scanEnabled: true,
        ...config.fileUpload
      },
      csrf: {
        enabled: true,
        secret: process.env.CSRF_SECRET || 'default-csrf-secret',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        ...config.csrf
      },
      inputValidation: {
        enabled: true,
        sanitizationEnabled: true,
        xssProtection: true,
        sqlInjectionProtection: true,
        ...config.inputValidation
      },
      monitoring: {
        enabled: true,
        alertThresholds: {
          suspiciousIPs: 10,
          blockedRequests: 50,
          threatFiles: 5,
          cspViolations: 20
        },
        ...config.monitoring
      }
    };
  }

  /**
   * Initialize comprehensive security middleware stack
   */
  initializeSecurityStack() {
    const middlewares: any[] = [];

    // 1. Rate limiting (first layer of defense)
    if (this.config.rateLimiting.enabled) {
      middlewares.push(this.createRateLimitingMiddleware());
    }

    // 2. CSRF protection
    if (this.config.csrf.enabled) {
      middlewares.push(csrfProtectionService.csrfProtection());
      middlewares.push(csrfProtectionService.securityHeaders());
    }

    // 3. Input validation and sanitization
    if (this.config.inputValidation.enabled) {
      middlewares.push(inputValidationService.sanitizeAllInputs());
    }

    return middlewares;
  }

  /**
   * Create comprehensive rate limiting middleware
   */
  private createRateLimitingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Different rate limits for different endpoint types
      const endpoint = req.path;
      let rateLimiter;

      if (endpoint.startsWith('/api/auth/')) {
        rateLimiter = rateLimitingService.createGeneralRateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 5, // 5 attempts per window
          message: 'Too many authentication attempts'
        });
      } else if (endpoint.startsWith('/api/chat/')) {
        rateLimiter = rateLimitingService.createAdaptiveRateLimit({
          baseWindowMs: 60 * 1000, // 1 minute
          baseMax: 20,
          loadThreshold: 0.8
        });
      } else if (endpoint.startsWith('/api/upload/')) {
        rateLimiter = rateLimitingService.createProgressiveRateLimit({
          windowMs: 60 * 1000, // 1 minute
          max: 5,
          progressiveWindowMs: 15 * 60 * 1000, // 15 minutes
          progressiveMax: 2
        });
      } else {
        rateLimiter = rateLimitingService.createGeneralRateLimit({
          windowMs: this.config.rateLimiting.windowMs,
          max: this.config.rateLimiting.max,
          message: this.config.rateLimiting.message
        });
      }

      return rateLimiter(req, res, next);
    };
  }

  /**
   * Create file upload security middleware
   */
  createFileUploadMiddleware(options: {
    fieldName: string;
    maxFiles?: number;
    allowedTypes?: string[];
  }) {
    return fileUploadSecurityService.secureUpload({
      fieldName: options.fieldName,
      maxFiles: options.maxFiles || 1,
      fileFilter: (req: Request, file: any, cb: any) => {
        const allowedTypes = options.allowedTypes || this.config.fileUpload.allowedMimeTypes;
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
      },
      limits: {
        fileSize: this.config.fileUpload.maxFileSize
      }
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.events.push(securityEvent);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Trigger alerts if necessary
    this.checkAlertThresholds(securityEvent);

    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(securityEvent);
      } catch (error) {
        console.error('Error in security alert callback:', error);
      }
    });
  }

  /**
   * Check if alert thresholds are exceeded
   */
  private checkAlertThresholds(event: SecurityEvent): void {
    if (!this.config.monitoring.enabled) return;

    const recentEvents = this.getRecentEvents(60 * 60 * 1000); // Last hour
    const thresholds = this.config.monitoring.alertThresholds;

    // Check suspicious IPs
    const suspiciousIPs = new Set(
      recentEvents
        .filter(e => e.severity === 'high' || e.severity === 'critical')
        .map(e => e.source)
    );

    if (suspiciousIPs.size >= thresholds.suspiciousIPs) {
      this.triggerAlert('suspicious_ip_threshold', {
        count: suspiciousIPs.size,
        threshold: thresholds.suspiciousIPs,
        ips: Array.from(suspiciousIPs)
      });
    }

    // Check blocked requests
    const blockedRequests = recentEvents.filter(e => e.action === 'blocked').length;
    if (blockedRequests >= thresholds.blockedRequests) {
      this.triggerAlert('blocked_requests_threshold', {
        count: blockedRequests,
        threshold: thresholds.blockedRequests
      });
    }

    // Check threat files
    const threatFiles = recentEvents.filter(e => e.type === 'file_threat').length;
    if (threatFiles >= thresholds.threatFiles) {
      this.triggerAlert('threat_files_threshold', {
        count: threatFiles,
        threshold: thresholds.threatFiles
      });
    }

    // Check CSP violations
    const cspViolations = recentEvents.filter(e => 
      e.details?.type === 'csp_violation'
    ).length;
    if (cspViolations >= thresholds.cspViolations) {
      this.triggerAlert('csp_violations_threshold', {
        count: cspViolations,
        threshold: thresholds.cspViolations
      });
    }
  }

  /**
   * Trigger security alert
   */
  private triggerAlert(type: string, details: any): void {
    console.warn(`Security Alert: ${type}`, details);
    
    // Here you could integrate with external alerting systems
    // such as email, Slack, PagerDuty, etc.
  }

  /**
   * Get recent security events
   */
  private getRecentEvents(timeWindowMs: number): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get comprehensive security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    const rateLimitMetrics = rateLimitingService.getMetrics();
    const fileUploadMetrics = fileUploadSecurityService.getMetrics();
    const csrfMetrics = csrfProtectionService.getMetrics();
    const validationMetrics = inputValidationService.getMetrics();

    return {
      rateLimiting: {
        totalRequests: rateLimitMetrics.requests.total,
        blockedRequests: rateLimitMetrics.requests.blocked,
        suspiciousIPs: Object.keys(rateLimitMetrics.blockedIPs),
        blockedPaths: Object.keys(rateLimitMetrics.blockedPaths)
      },
      fileUpload: {
        totalUploads: fileUploadMetrics.totalScans,
        threatFiles: fileUploadMetrics.threatsDetected,
        quarantinedFiles: fileUploadMetrics.quarantinedFiles,
        detectedThreats: fileUploadMetrics.threatTypes
      },
      csrf: {
        tokenGenerated: csrfMetrics.tokensGenerated,
        tokenValidated: csrfMetrics.tokensValidated,
        validationFailures: csrfMetrics.validationFailures,
        cspViolations: csrfMetrics.cspViolations
      },
      inputValidation: {
        totalValidations: validationMetrics.totalValidations,
        validationFailures: validationMetrics.validationFailures,
        blockedXSSAttempts: validationMetrics.blockedXSSAttempts,
        blockedSQLInjections: validationMetrics.blockedSQLInjections
      }
    };
  }

  /**
   * Get security events with filtering
   */
  getSecurityEvents(options: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    source?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (options.type) {
      filteredEvents = filteredEvents.filter(e => e.type === options.type);
    }

    if (options.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === options.severity);
    }

    if (options.source) {
      filteredEvents = filteredEvents.filter(e => e.source === options.source);
    }

    if (options.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= options.startDate!);
    }

    if (options.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= options.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options.limit) {
      filteredEvents = filteredEvents.slice(0, options.limit);
    }

    return filteredEvents;
  }

  /**
   * Register alert callback
   */
  onSecurityAlert(callback: (event: SecurityEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeSecurityAlert(callback: (event: SecurityEvent) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Health check for all security services
   */
  healthCheck() {
    const rateLimitHealth = rateLimitingService.healthCheck();
    const fileUploadHealth = fileUploadSecurityService.healthCheck();
    const csrfHealth = csrfProtectionService.healthCheck();
    const validationHealth = inputValidationService.healthCheck();

    const overallStatus = [
      rateLimitHealth.status,
      fileUploadHealth.status,
      csrfHealth.status,
      validationHealth.status
    ].includes('error') ? 'error' : 
    [
      rateLimitHealth.status,
      fileUploadHealth.status,
      csrfHealth.status,
      validationHealth.status
    ].includes('warning') ? 'warning' : 'healthy';

    const recentCriticalEvents = this.getRecentEvents(60 * 60 * 1000)
      .filter(e => e.severity === 'critical').length;

    return {
      status: overallStatus,
      components: {
        rateLimiting: rateLimitHealth,
        fileUpload: fileUploadHealth,
        csrf: csrfHealth,
        inputValidation: validationHealth
      },
      recentCriticalEvents,
      configuration: this.config,
      eventsCount: this.events.length,
      lastEventTime: this.events.length > 0 ? 
        this.events[this.events.length - 1].timestamp : null
    };
  }

  /**
   * Reset all metrics and events
   */
  reset(): void {
    this.events = [];
    rateLimitingService.resetMetrics();
    fileUploadSecurityService.resetMetrics();
    csrfProtectionService.resetMetrics();
    inputValidationService.resetMetrics();
  }

  /**
   * Update security configuration
   */
  updateConfiguration(config: Partial<SecurityConfiguration>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Export security report
   */
  generateSecurityReport(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
    const timeWindows = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const events = this.getRecentEvents(timeWindows[timeframe]);
    const metrics = this.getSecurityMetrics();

    return {
      period: timeframe,
      startDate: new Date(Date.now() - timeWindows[timeframe]),
      endDate: new Date(),
      summary: {
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.severity === 'critical').length,
        highSeverityEvents: events.filter(e => e.severity === 'high').length,
        mediumSeverityEvents: events.filter(e => e.severity === 'medium').length,
        lowSeverityEvents: events.filter(e => e.severity === 'low').length
      },
      metrics,
      topThreats: this.getTopThreats(events),
      recommendations: this.generateRecommendations(events, metrics)
    };
  }

  /**
   * Get top threats from events
   */
  private getTopThreats(events: SecurityEvent[]): { type: string; count: number }[] {
    const threatCounts = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(threatCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(events: SecurityEvent[], metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.rateLimiting.blockedRequests > 100) {
      recommendations.push('High number of blocked requests detected. Consider implementing additional DDoS protection.');
    }

    if (metrics.fileUpload.threatFiles > 10) {
      recommendations.push('Multiple threat files detected. Review file upload policies and scanning rules.');
    }

    if (metrics.inputValidation.blockedXSSAttempts > 20) {
      recommendations.push('XSS attempts detected. Consider implementing stricter input validation.');
    }

    if (metrics.inputValidation.blockedSQLInjections > 10) {
      recommendations.push('SQL injection attempts detected. Review database security and parameterized queries.');
    }

    if (metrics.csrf.cspViolations > 50) {
      recommendations.push('Multiple CSP violations detected. Review and tighten Content Security Policy.');
    }

    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    if (criticalEvents > 5) {
      recommendations.push('Multiple critical security events detected. Immediate investigation recommended.');
    }

    return recommendations;
  }
}

// Create singleton instance
export const securityService = new SecurityService({
  rateLimiting: {
    enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP'
  },
  fileUpload: {
    enabled: process.env.FILE_UPLOAD_SECURITY_ENABLED !== 'false',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,text/plain').split(','),
    scanEnabled: process.env.FILE_SCAN_ENABLED !== 'false'
  },
  csrf: {
    enabled: process.env.CSRF_PROTECTION_ENABLED !== 'false',
    secret: process.env.CSRF_SECRET || 'default-csrf-secret',
    sameSite: (process.env.CSRF_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
    secure: process.env.NODE_ENV === 'production'
  },
  inputValidation: {
    enabled: process.env.INPUT_VALIDATION_ENABLED !== 'false',
    sanitizationEnabled: process.env.INPUT_SANITIZATION_ENABLED !== 'false',
    xssProtection: process.env.XSS_PROTECTION_ENABLED !== 'false',
    sqlInjectionProtection: process.env.SQL_INJECTION_PROTECTION_ENABLED !== 'false'
  },
  monitoring: {
    enabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
    alertThresholds: {
      suspiciousIPs: parseInt(process.env.SUSPICIOUS_IPS_THRESHOLD || '10'),
      blockedRequests: parseInt(process.env.BLOCKED_REQUESTS_THRESHOLD || '50'),
      threatFiles: parseInt(process.env.THREAT_FILES_THRESHOLD || '5'),
      cspViolations: parseInt(process.env.CSP_VIOLATIONS_THRESHOLD || '20')
    }
  }
});