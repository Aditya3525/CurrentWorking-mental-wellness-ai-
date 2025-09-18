import { Request, Response } from 'express';
import { securityService } from '../services/security/securityService';
import { rateLimitingService } from '../services/security/rateLimitingService';
import { fileUploadSecurityService } from '../services/security/fileUploadSecurityService';
import { csrfProtectionService } from '../services/security/csrfProtectionService';
import { inputValidationService, commonValidationRules, ValidationRule } from '../services/security/inputValidationService';

export class SecurityController {
  /**
   * Get comprehensive security overview
   */
  async getSecurityOverview(req: Request, res: Response): Promise<void> {
    try {
      const metrics = securityService.getSecurityMetrics();
      const healthCheck = securityService.healthCheck();
      const recentEvents = securityService.getSecurityEvents({ limit: 50 });

      res.json({
        success: true,
        data: {
          metrics,
          health: healthCheck,
          recentEvents,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting security overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security overview'
      });
    }
  }

  /**
   * Get security metrics with time range
   */
  async getSecurityMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe = 'day' } = req.query;
      const report = securityService.generateSecurityReport(timeframe as 'hour' | 'day' | 'week' | 'month');

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error getting security metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security metrics'
      });
    }
  }

  /**
   * Get security events with filtering
   */
  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const {
        type,
        severity,
        source,
        limit = '100',
        startDate,
        endDate
      } = req.query;

      const options: any = {
        limit: parseInt(limit as string),
      };

      if (type) options.type = type;
      if (severity) options.severity = severity;
      if (source) options.source = source;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const events = securityService.getSecurityEvents(options);

      res.json({
        success: true,
        data: {
          events,
          total: events.length,
          filters: options
        }
      });
    } catch (error) {
      console.error('Error getting security events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security events'
      });
    }
  }

  /**
   * Get rate limiting metrics and configuration
   */
  async getRateLimitingStatus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = rateLimitingService.getMetrics();
      const healthCheck = rateLimitingService.healthCheck();

      res.json({
        success: true,
        data: {
          metrics,
          health: healthCheck,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting rate limiting status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get rate limiting status'
      });
    }
  }

  /**
   * Manage IP whitelist/blacklist
   */
  async manageIPList(req: Request, res: Response): Promise<void> {
    try {
      const { action, ip, type } = req.body;

      if (!ip || !action || !type) {
        res.status(400).json({
          success: false,
          error: 'IP, action, and type are required'
        });
        return;
      }

      let result;
      switch (action) {
        case 'add':
          if (type === 'whitelist') {
            result = rateLimitingService.addToWhitelist(ip);
          } else if (type === 'blacklist') {
            result = rateLimitingService.addToBlacklist(ip);
          } else {
            throw new Error('Invalid list type');
          }
          break;

        case 'remove':
          if (type === 'whitelist') {
            result = rateLimitingService.removeFromWhitelist(ip);
          } else if (type === 'blacklist') {
            result = rateLimitingService.removeFromBlacklist(ip);
          } else {
            throw new Error('Invalid list type');
          }
          break;

        default:
          throw new Error('Invalid action');
      }

      res.json({
        success: true,
        data: { result, action, ip, type }
      });
    } catch (error) {
      console.error('Error managing IP list:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to manage IP list'
      });
    }
  }

  /**
   * Get file upload security status
   */
  async getFileUploadStatus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = fileUploadSecurityService.getMetrics();
      const healthCheck = fileUploadSecurityService.healthCheck();

      res.json({
        success: true,
        data: {
          metrics,
          health: healthCheck,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting file upload status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get file upload status'
      });
    }
  }

  /**
   * Get quarantined files
   */
  async getQuarantinedFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = await fileUploadSecurityService.getQuarantinedFiles();

      res.json({
        success: true,
        data: {
          files,
          count: files.length,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting quarantined files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quarantined files'
      });
    }
  }

  /**
   * Release or delete quarantined file
   */
  async manageQuarantinedFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const { action } = req.body;

      if (!action || !['release', 'delete'].includes(action)) {
        res.status(400).json({
          success: false,
          error: 'Valid action (release or delete) is required'
        });
        return;
      }

      let result;
      if (action === 'release') {
        result = await fileUploadSecurityService.releaseFromQuarantine(fileId);
      } else {
        result = await fileUploadSecurityService.deleteQuarantinedFile(fileId);
      }

      res.json({
        success: true,
        data: { result, action, fileId }
      });
    } catch (error) {
      console.error('Error managing quarantined file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to manage quarantined file'
      });
    }
  }

  /**
   * Get CSRF protection status
   */
  async getCSRFStatus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = csrfProtectionService.getMetrics();
      const healthCheck = csrfProtectionService.healthCheck();

      res.json({
        success: true,
        data: {
          metrics,
          health: healthCheck,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting CSRF status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get CSRF status'
      });
    }
  }

  /**
   * Generate new CSRF token
   */
  async generateCSRFToken(req: Request, res: Response): Promise<void> {
    try {
      const token = csrfProtectionService.generateToken();

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate CSRF token'
      });
    }
  }

  /**
   * Get input validation status
   */
  async getInputValidationStatus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = inputValidationService.getMetrics();
      const healthCheck = inputValidationService.healthCheck();

      res.json({
        success: true,
        data: {
          metrics,
          health: healthCheck,
          commonRules: commonValidationRules,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting input validation status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get input validation status'
      });
    }
  }

  /**
   * Validate input against rules
   */
  async validateInput(req: Request, res: Response): Promise<void> {
    try {
      const { value, rule } = req.body;

      if (!value || !rule) {
        res.status(400).json({
          success: false,
          error: 'Value and rule are required'
        });
        return;
      }

      const result = inputValidationService.validateSingle(value, rule as ValidationRule);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error validating input:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate input'
      });
    }
  }

  /**
   * Get security configuration
   */
  async getSecurityConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = securityService.healthCheck();

      res.json({
        success: true,
        data: {
          configuration: healthCheck.configuration,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error getting security configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security configuration'
      });
    }
  }

  /**
   * Update security configuration
   */
  async updateSecurityConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { configuration } = req.body;

      if (!configuration) {
        res.status(400).json({
          success: false,
          error: 'Configuration is required'
        });
        return;
      }

      securityService.updateConfiguration(configuration);

      res.json({
        success: true,
        data: { message: 'Configuration updated successfully' }
      });
    } catch (error) {
      console.error('Error updating security configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update security configuration'
      });
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe = 'day', format = 'json' } = req.query;

      const report = securityService.generateSecurityReport(
        timeframe as 'hour' | 'day' | 'week' | 'month'
      );

      if (format === 'csv') {
        const csv = this.convertReportToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="security-report-${timeframe}.csv"`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: report
        });
      }
    } catch (error) {
      console.error('Error generating security report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate security report'
      });
    }
  }

  /**
   * Reset security metrics
   */
  async resetSecurityMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { component } = req.body;

      if (component) {
        switch (component) {
          case 'rateLimiting':
            rateLimitingService.resetMetrics();
            break;
          case 'fileUpload':
            // Reset would need to be implemented in fileUploadSecurityService
            break;
          case 'csrf':
            csrfProtectionService.resetMetrics();
            break;
          case 'inputValidation':
            inputValidationService.resetMetrics();
            break;
          default:
            throw new Error('Invalid component');
        }
      } else {
        securityService.reset();
      }

      res.json({
        success: true,
        data: { message: `Security metrics reset successfully${component ? ` for ${component}` : ''}` }
      });
    } catch (error) {
      console.error('Error resetting security metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset security metrics'
      });
    }
  }

  /**
   * Get real-time security events stream
   */
  async getSecurityEventsStream(req: Request, res: Response): Promise<void> {
    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial data
      const initialEvents = securityService.getSecurityEvents({ limit: 10 });
      res.write(`data: ${JSON.stringify({ type: 'initial', events: initialEvents })}\n\n`);

      // Set up event listener for new security events
      const eventListener = (event: any) => {
        res.write(`data: ${JSON.stringify({ type: 'new', event })}\n\n`);
      };

      securityService.onSecurityAlert(eventListener);

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date() })}\n\n`);
      }, 30000);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(heartbeat);
        securityService.removeSecurityAlert(eventListener);
      });

    } catch (error) {
      console.error('Error setting up security events stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set up security events stream'
      });
    }
  }

  /**
   * Test security controls
   */
  async testSecurityControls(req: Request, res: Response): Promise<void> {
    try {
      const { controlType } = req.body;

      const results: any = {};

      switch (controlType) {
        case 'rateLimiting':
          results.rateLimiting = rateLimitingService.healthCheck();
          break;

        case 'fileUpload':
          results.fileUpload = fileUploadSecurityService.healthCheck();
          break;

        case 'csrf':
          results.csrf = csrfProtectionService.healthCheck();
          break;

        case 'inputValidation':
          results.inputValidation = inputValidationService.healthCheck();
          break;

        case 'all':
        default:
          results.overall = securityService.healthCheck();
          break;
      }

      res.json({
        success: true,
        data: {
          testResults: results,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error testing security controls:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test security controls'
      });
    }
  }

  /**
   * Convert security report to CSV format
   */
  private convertReportToCSV(report: any): string {
    const headers = [
      'Metric',
      'Value',
      'Category'
    ];

    const rows = [];

    // Add summary data
    Object.entries(report.summary).forEach(([key, value]) => {
      rows.push([key, value, 'Summary']);
    });

    // Add metrics data
    Object.entries(report.metrics).forEach(([category, metrics]) => {
      Object.entries(metrics as any).forEach(([key, value]) => {
        rows.push([key, Array.isArray(value) ? value.length : value, category]);
      });
    });

    // Add top threats
    report.topThreats.forEach((threat: any, index: number) => {
      rows.push([`Top Threat ${index + 1}`, `${threat.type} (${threat.count})`, 'Threats']);
    });

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}

// Create singleton instance
export const securityController = new SecurityController();