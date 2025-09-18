import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import helmet from 'helmet';

export interface CSRFConfig {
  enabled: boolean;
  tokenLength: number;
  cookieName: string;
  headerName: string;
  excludePaths: string[];
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  maxAge: number; // milliseconds
}

export interface SecurityHeadersConfig {
  enabled: boolean;
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  contentTypeOptions: boolean;
  xssProtection: boolean;
  referrerPolicy: string;
  permissionsPolicy: Record<string, string[]>;
}

export interface SecurityMetrics {
  csrfAttemptsBlocked: number;
  xssAttemptsBlocked: number;
  invalidTokens: number;
  securityHeadersApplied: number;
  suspiciousRequests: number;
}

export class CSRFProtectionService {
  private config: CSRFConfig;
  private securityConfig: SecurityHeadersConfig;
  private metrics: SecurityMetrics = {
    csrfAttemptsBlocked: 0,
    xssAttemptsBlocked: 0,
    invalidTokens: 0,
    securityHeadersApplied: 0,
    suspiciousRequests: 0
  };
  private tokenStore = new Map<string, { token: string; expires: number; userId?: string }>();

  constructor(
    csrfConfig: CSRFConfig = {
      enabled: true,
      tokenLength: 32,
      cookieName: '_csrf',
      headerName: 'x-csrf-token',
      excludePaths: ['/api/auth/login', '/api/auth/register', '/api/webhooks'],
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    securityConfig: SecurityHeadersConfig = {
      enabled: true,
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'https://api.openai.com'],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'object-src': ["'none'"]
        }
      },
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      frameOptions: 'DENY',
      contentTypeOptions: true,
      xssProtection: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        'camera': ['none'],
        'microphone': ['none'],
        'geolocation': ['none'],
        'payment': ['none'],
        'usb': ['none']
      }
    }
  ) {
    this.config = csrfConfig;
    this.securityConfig = securityConfig;
    this.startTokenCleanup();
  }

  private startTokenCleanup() {
    // Clean expired tokens every hour
    setInterval(() => {
      this.cleanExpiredTokens();
    }, 60 * 60 * 1000);
  }

  private cleanExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, tokenData] of this.tokenStore) {
      if (tokenData.expires < now) {
        this.tokenStore.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`CSRF: Cleaned ${cleanedCount} expired tokens`);
    }
  }

  /**
   * Generate CSRF token
   */
  generateToken(sessionId: string, userId?: string): string {
    if (!this.config.enabled) return '';

    const token = crypto.randomBytes(this.config.tokenLength).toString('hex');
    const expires = Date.now() + this.config.maxAge;

    this.tokenStore.set(sessionId, { token, expires, userId });

    return token;
  }

  /**
   * Validate CSRF token
   */
  validateToken(sessionId: string, providedToken: string): boolean {
    if (!this.config.enabled) return true;

    const tokenData = this.tokenStore.get(sessionId);
    
    if (!tokenData) {
      this.metrics.invalidTokens++;
      return false;
    }

    if (tokenData.expires < Date.now()) {
      this.tokenStore.delete(sessionId);
      this.metrics.invalidTokens++;
      return false;
    }

    if (tokenData.token !== providedToken) {
      this.metrics.invalidTokens++;
      return false;
    }

    return true;
  }

  /**
   * CSRF protection middleware
   */
  csrfProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      // Skip CSRF protection for excluded paths
      if (this.config.excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const sessionId = this.getSessionId(req);
      if (!sessionId) {
        this.metrics.csrfAttemptsBlocked++;
        return res.status(403).json({ error: 'No session found' });
      }

      // Get token from header or body
      const token = req.headers[this.config.headerName] as string || 
                   req.body._csrf || 
                   req.query._csrf;

      if (!token) {
        this.metrics.csrfAttemptsBlocked++;
        return res.status(403).json({ error: 'CSRF token missing' });
      }

      if (!this.validateToken(sessionId, token)) {
        this.metrics.csrfAttemptsBlocked++;
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }

      next();
    };
  }

  /**
   * Middleware to set CSRF token in response
   */
  setCSRFToken() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      const sessionId = this.getSessionId(req);
      if (sessionId) {
        const token = this.generateToken(sessionId, (req as any).user?.id);
        
        // Set token in cookie
        res.cookie(this.config.cookieName, token, {
          httpOnly: true,
          secure: this.config.secure,
          sameSite: this.config.sameSite,
          maxAge: this.config.maxAge
        });

        // Also make token available to client via header
        res.setHeader('X-CSRF-Token', token);
      }

      next();
    };
  }

  /**
   * Security headers middleware
   */
  securityHeaders() {
    if (!this.securityConfig.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    const helmetConfig: any = {};

    // Content Security Policy
    if (this.securityConfig.contentSecurityPolicy.enabled) {
      helmetConfig.contentSecurityPolicy = {
        directives: this.securityConfig.contentSecurityPolicy.directives
      };
    }

    // HTTP Strict Transport Security
    if (this.securityConfig.hsts.enabled) {
      helmetConfig.hsts = {
        maxAge: this.securityConfig.hsts.maxAge,
        includeSubDomains: this.securityConfig.hsts.includeSubDomains,
        preload: this.securityConfig.hsts.preload
      };
    }

    // Frame Options
    helmetConfig.frameguard = { action: this.securityConfig.frameOptions.toLowerCase() };

    // Content Type Options
    helmetConfig.noSniff = this.securityConfig.contentTypeOptions;

    // XSS Protection
    helmetConfig.xssFilter = this.securityConfig.xssProtection;

    // Referrer Policy
    helmetConfig.referrerPolicy = { policy: this.securityConfig.referrerPolicy };

    // Permissions Policy
    helmetConfig.permissionsPolicy = this.securityConfig.permissionsPolicy;

    const helmetMiddleware = helmet(helmetConfig);

    return (req: Request, res: Response, next: NextFunction) => {
      this.metrics.securityHeadersApplied++;
      helmetMiddleware(req, res, next);
    };
  }

  /**
   * Input sanitization middleware
   */
  inputSanitization() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.body) {
        this.sanitizeObject(req.body);
      }
      
      if (req.query) {
        this.sanitizeObject(req.query);
      }

      if (req.params) {
        this.sanitizeObject(req.params);
      }

      next();
    };
  }

  private sanitizeObject(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Detect and prevent XSS
        if (this.containsXSS(obj[key])) {
          this.metrics.xssAttemptsBlocked++;
          obj[key] = this.sanitizeXSS(obj[key]);
        }
        
        // Detect and prevent SQL injection
        if (this.containsSQLInjection(obj[key])) {
          this.metrics.suspiciousRequests++;
          obj[key] = this.sanitizeSQLInjection(obj[key]);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeObject(obj[key]);
      }
    }
  }

  private containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /<img[^>]*src[^>]*onerror/gi,
      /<svg[^>]*onload/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  private sanitizeXSS(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  private containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+[\w\s]*\s*=\s*[\w\s]*)/gi,
      /(--|#|\/\*|\*\/)/g,
      /(\bor\b\s+\b1\b\s*=\s*\b1\b)/gi,
      /(\bunion\b\s+\bselect\b)/gi,
      /(\bdrop\b\s+\btable\b)/gi,
      /(\binsert\b\s+\binto\b)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  private sanitizeSQLInjection(input: string): string {
    return input
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .replace(/--/g, '')     // Remove SQL comments
      .replace(/#/g, '')      // Remove MySQL comments
      .replace(/\/\*/g, '')   // Remove block comments start
      .replace(/\*\//g, '')   // Remove block comments end
      .replace(/;/g, '');     // Remove semicolons
  }

  private getSessionId(req: Request): string | null {
    // Try to get session ID from various sources
    return req.sessionID || 
           req.headers['x-session-id'] as string ||
           req.cookies?.sessionId ||
           null;
  }

  /**
   * Content Security Policy violation reporting
   */
  cspViolationReporter() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.path === '/api/security/csp-violation') {
        const violation = req.body;
        
        console.warn('CSP Violation Report:', {
          documentURI: violation['document-uri'],
          violatedDirective: violation['violated-directive'],
          blockedURI: violation['blocked-uri'],
          sourceFile: violation['source-file'],
          lineNumber: violation['line-number'],
          timestamp: new Date()
        });

        this.metrics.suspiciousRequests++;
        return res.status(204).end();
      }
      
      next();
    };
  }

  /**
   * Double Submit Cookie pattern
   */
  doubleSubmitCookie() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const cookieToken = req.cookies[this.config.cookieName];
      const headerToken = req.headers[this.config.headerName] as string;

      if (!cookieToken || !headerToken) {
        this.metrics.csrfAttemptsBlocked++;
        return res.status(403).json({ error: 'CSRF tokens missing' });
      }

      if (cookieToken !== headerToken) {
        this.metrics.csrfAttemptsBlocked++;
        return res.status(403).json({ error: 'CSRF tokens do not match' });
      }

      next();
    };
  }

  /**
   * Rate limit CSRF token generation
   */
  tokenGenerationRateLimit() {
    const tokenRequests = new Map<string, number[]>();

    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 10; // 10 token requests per minute

      if (!tokenRequests.has(ip)) {
        tokenRequests.set(ip, []);
      }

      const requests = tokenRequests.get(ip)!;
      
      // Remove old requests
      const recentRequests = requests.filter(time => now - time < windowMs);
      tokenRequests.set(ip, recentRequests);

      if (recentRequests.length >= maxRequests) {
        this.metrics.suspiciousRequests++;
        return res.status(429).json({ error: 'Too many token requests' });
      }

      recentRequests.push(now);
      next();
    };
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      csrfAttemptsBlocked: 0,
      xssAttemptsBlocked: 0,
      invalidTokens: 0,
      securityHeadersApplied: 0,
      suspiciousRequests: 0
    };
  }

  /**
   * Health check for CSRF protection
   */
  healthCheck() {
    const metrics = this.getMetrics();
    let status = 'healthy';
    const recommendations: string[] = [];

    if (metrics.csrfAttemptsBlocked > 100) {
      status = 'warning';
      recommendations.push('High number of CSRF attacks detected. Review security logs.');
    }

    if (metrics.xssAttemptsBlocked > 50) {
      status = 'warning';
      recommendations.push('XSS attempts detected. Consider additional input validation.');
    }

    if (metrics.suspiciousRequests > 200) {
      status = 'warning';
      recommendations.push('High number of suspicious requests. Review access patterns.');
    }

    return {
      status,
      metrics,
      recommendations,
      tokensActive: this.tokenStore.size,
      csrfEnabled: this.config.enabled,
      securityHeadersEnabled: this.securityConfig.enabled
    };
  }

  /**
   * Get active tokens count
   */
  getActiveTokensCount(): number {
    return this.tokenStore.size;
  }

  /**
   * Revoke token for session
   */
  revokeToken(sessionId: string): boolean {
    return this.tokenStore.delete(sessionId);
  }

  /**
   * Clear all tokens
   */
  clearAllTokens(): void {
    this.tokenStore.clear();
  }
}

// Create singleton instance
export const csrfProtectionService = new CSRFProtectionService(
  {
    enabled: process.env.CSRF_PROTECTION_ENABLED !== 'false',
    tokenLength: parseInt(process.env.CSRF_TOKEN_LENGTH || '32'),
    cookieName: process.env.CSRF_COOKIE_NAME || '_csrf',
    headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    excludePaths: (process.env.CSRF_EXCLUDE_PATHS || '/api/auth/login,/api/auth/register').split(','),
    sameSite: (process.env.CSRF_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: parseInt(process.env.CSRF_MAX_AGE || '86400000') // 24 hours
  },
  {
    enabled: process.env.SECURITY_HEADERS_ENABLED !== 'false',
    contentSecurityPolicy: {
      enabled: process.env.CSP_ENABLED !== 'false',
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https://api.openai.com'],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'object-src': ["'none'"]
      }
    },
    hsts: {
      enabled: process.env.HSTS_ENABLED !== 'false',
      maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
      preload: process.env.HSTS_PRELOAD !== 'false'
    },
    frameOptions: (process.env.FRAME_OPTIONS as 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM') || 'DENY',
    contentTypeOptions: process.env.CONTENT_TYPE_OPTIONS !== 'false',
    xssProtection: process.env.XSS_PROTECTION !== 'false',
    referrerPolicy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      'camera': ['none'],
      'microphone': ['none'],
      'geolocation': ['none'],
      'payment': ['none'],
      'usb': ['none']
    }
  }
);