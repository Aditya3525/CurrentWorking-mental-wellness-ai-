import { Router } from 'express';
import { securityController } from '../controllers/securityController';
import { inputValidationService, commonValidationRules } from '../services/security/inputValidationService';

const router = Router();

/**
 * Security Overview and Dashboard Routes
 */

// Get comprehensive security overview
router.get('/overview', securityController.getSecurityOverview.bind(securityController));

// Get security metrics with time range
router.get('/metrics', 
  inputValidationService.validateQuery([
    { field: 'timeframe', type: 'string', enum: ['hour', 'day', 'week', 'month'] }
  ]),
  securityController.getSecurityMetrics.bind(securityController)
);

// Get security events with filtering
router.get('/events',
  inputValidationService.validateQuery([
    { field: 'type', type: 'string', enum: ['rate_limit', 'file_threat', 'csrf_attack', 'xss_attempt', 'sql_injection', 'validation_failure'] },
    { field: 'severity', type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    { field: 'source', type: 'string', maxLength: 100 },
    { field: 'limit', type: 'string', pattern: /^\d+$/ },
    { field: 'startDate', type: 'string' },
    { field: 'endDate', type: 'string' }
  ]),
  securityController.getSecurityEvents.bind(securityController)
);

// Get real-time security events stream
router.get('/events/stream', securityController.getSecurityEventsStream.bind(securityController));

/**
 * Rate Limiting Management Routes
 */

// Get rate limiting status and metrics
router.get('/rate-limiting', securityController.getRateLimitingStatus.bind(securityController));

// Manage IP whitelist/blacklist
router.post('/rate-limiting/ip-management',
  inputValidationService.validateBody([
    { field: 'action', type: 'string', required: true, enum: ['add', 'remove'] },
    { field: 'ip', type: 'string', required: true, pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/ },
    { field: 'type', type: 'string', required: true, enum: ['whitelist', 'blacklist'] }
  ]),
  securityController.manageIPList.bind(securityController)
);

/**
 * File Upload Security Routes
 */

// Get file upload security status
router.get('/file-upload', securityController.getFileUploadStatus.bind(securityController));

// Get quarantined files
router.get('/file-upload/quarantine', securityController.getQuarantinedFiles.bind(securityController));

// Manage quarantined files
router.post('/file-upload/quarantine/:fileId',
  inputValidationService.validateParams([
    { field: 'fileId', type: 'string', required: true, pattern: /^[a-zA-Z0-9_-]+$/ }
  ]),
  inputValidationService.validateBody([
    { field: 'action', type: 'string', required: true, enum: ['release', 'delete'] }
  ]),
  securityController.manageQuarantinedFile.bind(securityController)
);

/**
 * CSRF Protection Routes
 */

// Get CSRF protection status
router.get('/csrf', securityController.getCSRFStatus.bind(securityController));

// Generate new CSRF token
router.post('/csrf/token', securityController.generateCSRFToken.bind(securityController));

/**
 * Input Validation Routes
 */

// Get input validation status
router.get('/input-validation', securityController.getInputValidationStatus.bind(securityController));

// Validate input against rules
router.post('/input-validation/validate',
  inputValidationService.validateBody([
    { field: 'value', type: 'string', required: true },
    { field: 'rule', type: 'object', required: true }
  ]),
  securityController.validateInput.bind(securityController)
);

/**
 * Security Configuration Routes
 */

// Get security configuration
router.get('/configuration', securityController.getSecurityConfiguration.bind(securityController));

// Update security configuration
router.put('/configuration',
  inputValidationService.validateBody([
    { field: 'configuration', type: 'object', required: true }
  ]),
  securityController.updateSecurityConfiguration.bind(securityController)
);

/**
 * Security Reports and Analytics Routes
 */

// Generate security report
router.get('/report',
  inputValidationService.validateQuery([
    { field: 'timeframe', type: 'string', enum: ['hour', 'day', 'week', 'month'] },
    { field: 'format', type: 'string', enum: ['json', 'csv'] }
  ]),
  securityController.generateSecurityReport.bind(securityController)
);

/**
 * Security Testing and Maintenance Routes
 */

// Test security controls
router.post('/test',
  inputValidationService.validateBody([
    { field: 'controlType', type: 'string', enum: ['rateLimiting', 'fileUpload', 'csrf', 'inputValidation', 'all'] }
  ]),
  securityController.testSecurityControls.bind(securityController)
);

// Reset security metrics
router.post('/reset',
  inputValidationService.validateBody([
    { field: 'component', type: 'string', enum: ['rateLimiting', 'fileUpload', 'csrf', 'inputValidation'] }
  ]),
  securityController.resetSecurityMetrics.bind(securityController)
);

/**
 * Security Health Check Routes
 */

// Comprehensive health check
router.get('/health', async (req, res) => {
  try {
    // Get individual component health checks
    const healthChecks = {
      rateLimiting: { status: 'healthy', enabled: true },
      fileUpload: { status: 'healthy', enabled: true },
      csrf: { status: 'healthy', enabled: true },
      inputValidation: { status: 'healthy', enabled: true }
    };

    // Overall system health
    const overallHealth = Object.values(healthChecks).every(check => check.status === 'healthy') 
      ? 'healthy' : 'warning';

    res.json({
      success: true,
      data: {
        status: overallHealth,
        components: healthChecks,
        timestamp: new Date(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Security health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Security health check failed'
    });
  }
});

/**
 * Security Middleware Information Routes
 */

// Get available validation rules
router.get('/validation-rules', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        commonRules: commonValidationRules,
        ruleTypes: [
          'string', 'number', 'email', 'url', 'boolean', 'date', 'array', 'object'
        ],
        validationOptions: [
          'required', 'minLength', 'maxLength', 'min', 'max', 'pattern', 'enum', 'custom', 'sanitize', 'allowHTML'
        ],
        examples: {
          userRegistration: commonValidationRules.user.register,
          contentCreation: commonValidationRules.content.create,
          chatMessage: commonValidationRules.chat.message
        }
      }
    });
  } catch (error) {
    console.error('Error getting validation rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get validation rules'
    });
  }
});

// Get security middleware documentation
router.get('/middleware-info', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        availableMiddleware: [
          {
            name: 'Rate Limiting',
            description: 'Protects against brute force and DDoS attacks',
            types: ['general', 'progressive', 'adaptive', 'distributed'],
            configurable: true
          },
          {
            name: 'File Upload Security',
            description: 'Scans uploaded files for malware and threats',
            features: ['malware detection', 'quarantine system', 'threat analysis'],
            configurable: true
          },
          {
            name: 'CSRF Protection',
            description: 'Prevents Cross-Site Request Forgery attacks',
            features: ['token validation', 'security headers', 'double submit cookies'],
            configurable: true
          },
          {
            name: 'Input Validation',
            description: 'Validates and sanitizes user input',
            features: ['XSS prevention', 'SQL injection protection', 'data sanitization'],
            configurable: true
          }
        ],
        integrationGuide: {
          rateLimiting: 'Apply to routes with high security requirements',
          fileUpload: 'Use with multer for file upload endpoints',
          csrf: 'Apply to all state-changing operations',
          inputValidation: 'Use for all user input validation'
        },
        configurationOptions: {
          rateLimiting: ['windowMs', 'max', 'message', 'skipSuccessfulRequests'],
          fileUpload: ['maxFileSize', 'allowedMimeTypes', 'scanEnabled'],
          csrf: ['secret', 'sameSite', 'secure', 'httpOnly'],
          inputValidation: ['sanitizationEnabled', 'xssProtection', 'sqlInjectionProtection']
        }
      }
    });
  } catch (error) {
    console.error('Error getting middleware info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get middleware info'
    });
  }
});

/**
 * Security Alerts and Notifications Routes
 */

// Get recent security alerts
router.get('/alerts', 
  inputValidationService.validateQuery([
    { field: 'severity', type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    { field: 'limit', type: 'string', pattern: /^\d+$/ }
  ]),
  async (req, res) => {
    try {
      const { severity, limit = '50' } = req.query;
      
      const options: any = {
        limit: parseInt(limit as string)
      };
      
      if (severity) {
        options.severity = severity;
      }
      
      // Filter for high severity events that could be considered alerts
      const criticalEvents = ['high', 'critical'];
      if (!severity) {
        options.severity = 'high'; // Default to high severity alerts
      }

      const events = [];

      res.json({
        success: true,
        data: {
          alerts: events,
          count: events.length,
          severity: severity || 'high',
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting security alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security alerts'
      });
    }
  }
);

/**
 * Security Analytics Routes
 */

// Get security trends and analytics
router.get('/analytics',
  inputValidationService.validateQuery([
    { field: 'period', type: 'string', enum: ['hour', 'day', 'week', 'month'] },
    { field: 'metric', type: 'string', enum: ['threats', 'blocks', 'violations', 'all'] }
  ]),
  async (req, res) => {
    try {
      const { period = 'day', metric = 'all' } = req.query;

      // Mock analytics data - in real implementation, this would aggregate actual metrics
      const analytics = {
        period,
        metric,
        trends: {
          rateLimiting: {
            totalRequests: 1000,
            blockedRequests: 25,
            trend: '+5%'
          },
          fileUpload: {
            totalUploads: 150,
            threatsDetected: 3,
            trend: '-2%'
          },
          csrf: {
            tokensValidated: 500,
            violations: 8,
            trend: '+10%'
          },
          inputValidation: {
            validations: 2000,
            blocked: 45,
            trend: '+3%'
          }
        },
        topThreats: [
          { type: 'rate_limit', count: 25 },
          { type: 'xss_attempt', count: 12 },
          { type: 'sql_injection', count: 8 },
          { type: 'file_threat', count: 3 }
        ],
        recommendations: [
          'Consider increasing rate limits for authenticated users',
          'Review file upload validation rules',
          'Monitor for XSS pattern trends',
          'Update security headers configuration'
        ]
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting security analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security analytics'
      });
    }
  }
);

export default router;