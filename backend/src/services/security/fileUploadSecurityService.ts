import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export interface FileUploadConfig {
  enabled: boolean;
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
  virusScanEnabled: boolean;
  quarantinePath: string;
  enableMalwareSignatures: boolean;
}

export interface ScanResult {
  safe: boolean;
  threats: string[];
  fileInfo: {
    name: string;
    size: number;
    mimeType: string;
    hash: string;
  };
  scanDetails: {
    signatureMatches: string[];
    suspiciousPatterns: string[];
    fileTypeValidation: boolean;
    sizeValidation: boolean;
  };
}

export interface FileUploadMetrics {
  totalUploads: number;
  scannedFiles: number;
  threatsDetected: number;
  quarantinedFiles: number;
  averageScanTime: number;
  topThreatTypes: Array<{ type: string; count: number }>;
}

export class FileUploadSecurityService {
  private config: FileUploadConfig;
  private metrics: FileUploadMetrics = {
    totalUploads: 0,
    scannedFiles: 0,
    threatsDetected: 0,
    quarantinedFiles: 0,
    averageScanTime: 0,
    topThreatTypes: []
  };
  private malwareSignatures: Map<string, string> = new Map();
  private threatCounts = new Map<string, number>();

  constructor(config: FileUploadConfig = {
    enabled: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/json', 'audio/mpeg', 'audio/wav'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.txt', '.csv', '.json', '.mp3', '.wav'
    ],
    uploadPath: './uploads',
    virusScanEnabled: true,
    quarantinePath: './quarantine',
    enableMalwareSignatures: true
  }) {
    this.config = config;
    this.initializeMalwareSignatures();
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.config.uploadPath, { recursive: true });
      await fs.mkdir(this.config.quarantinePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  private initializeMalwareSignatures() {
    if (!this.config.enableMalwareSignatures) return;

    // Common malware signatures (simplified for demonstration)
    this.malwareSignatures.set('EICAR', '58354f2150254041505b345c505a5834353428505e2924434329377d24454943415224');
    this.malwareSignatures.set('PE_HEADER', '4d5a'); // PE executable header
    this.malwareSignatures.set('ELF_HEADER', '7f454c46'); // ELF executable header
    this.malwareSignatures.set('SCRIPT_INJECTION', '3c7363726970743e'); // <script> tag
    this.malwareSignatures.set('PHP_BACKDOOR', '3c3f706870'); // <?php
    this.malwareSignatures.set('SUSPICIOUS_EVAL', '6576616c28'); // eval(
    this.malwareSignatures.set('BASE64_PAYLOAD', '496e766f6b652d45787072657373696f6e'); // Invoke-Expression in base64
  }

  /**
   * Create multer middleware with security scanning
   */
  createUploadMiddleware(fieldName: string = 'file', maxFiles: number = 1) {
    if (!this.config.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    const storage = multer.memoryStorage(); // Store in memory for scanning

    const upload = multer({
      storage,
      limits: {
        fileSize: this.config.maxFileSize,
        files: maxFiles
      },
      fileFilter: (req, file, cb) => {
        // Validate file type
        const isValidMimeType = this.config.allowedMimeTypes.includes(file.mimetype);
        const isValidExtension = this.config.allowedExtensions.some(ext => 
          file.originalname.toLowerCase().endsWith(ext.toLowerCase())
        );

        if (!isValidMimeType || !isValidExtension) {
          return cb(new Error(`File type not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`));
        }

        cb(null, true);
      }
    });

    return async (req: Request, res: Response, next: NextFunction) => {
      const uploadHandler = upload.array(fieldName, maxFiles);

      uploadHandler(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ 
                error: `File too large. Maximum size: ${this.config.maxFileSize / (1024 * 1024)}MB` 
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({ 
                error: `Too many files. Maximum: ${maxFiles}` 
              });
            }
          }
          return res.status(400).json({ error: err.message });
        }

        // Scan uploaded files
        if (req.files && Array.isArray(req.files)) {
          try {
            const scanResults = await Promise.all(
              req.files.map(file => this.scanFile(file))
            );

            // Check if any file failed security scan
            const threatFiles = scanResults.filter(result => !result.safe);
            if (threatFiles.length > 0) {
              // Quarantine threat files
              await Promise.all(
                threatFiles.map((result, index) => 
                  this.quarantineFile(req.files![index] as Express.Multer.File, result)
                )
              );

              return res.status(400).json({
                error: 'Security threat detected in uploaded files',
                threats: threatFiles.map(result => ({
                  file: result.fileInfo.name,
                  threats: result.threats
                }))
              });
            }

            // Save safe files
            const savedFiles = await Promise.all(
              req.files.map(async (file, index) => {
                const scanResult = scanResults[index];
                const savedPath = await this.saveSecureFile(file, scanResult);
                return {
                  originalName: file.originalname,
                  savedPath,
                  size: file.size,
                  mimeType: file.mimetype,
                  hash: scanResult.fileInfo.hash,
                  scanResult
                };
              })
            );

            // Attach file info to request for next middleware
            (req as any).secureFiles = savedFiles;
            next();

          } catch (error) {
            console.error('File scanning error:', error);
            return res.status(500).json({ error: 'File security scan failed' });
          }
        } else {
          next();
        }
      });
    };
  }

  /**
   * Scan file for security threats
   */
  async scanFile(file: Express.Multer.File): Promise<ScanResult> {
    const startTime = Date.now();
    this.metrics.totalUploads++;
    this.metrics.scannedFiles++;

    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const result: ScanResult = {
      safe: true,
      threats: [],
      fileInfo: {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        hash: fileHash
      },
      scanDetails: {
        signatureMatches: [],
        suspiciousPatterns: [],
        fileTypeValidation: true,
        sizeValidation: true
      }
    };

    try {
      // 1. File size validation
      if (file.size > this.config.maxFileSize) {
        result.safe = false;
        result.threats.push('File size exceeds maximum allowed');
        result.scanDetails.sizeValidation = false;
      }

      // 2. MIME type validation
      if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
        result.safe = false;
        result.threats.push('Invalid or suspicious MIME type');
        result.scanDetails.fileTypeValidation = false;
      }

      // 3. File extension validation
      const ext = path.extname(file.originalname).toLowerCase();
      if (!this.config.allowedExtensions.includes(ext)) {
        result.safe = false;
        result.threats.push('Invalid or suspicious file extension');
      }

      // 4. Malware signature detection
      if (this.config.enableMalwareSignatures) {
        const hexContent = file.buffer.toString('hex').toLowerCase();
        
        for (const [threatName, signature] of this.malwareSignatures) {
          if (hexContent.includes(signature)) {
            result.safe = false;
            result.threats.push(`Malware signature detected: ${threatName}`);
            result.scanDetails.signatureMatches.push(threatName);
            this.trackThreat(threatName);
          }
        }
      }

      // 5. Content analysis for suspicious patterns
      const suspiciousPatterns = this.analyzeSuspiciousPatterns(file);
      if (suspiciousPatterns.length > 0) {
        result.safe = false;
        result.threats.push(...suspiciousPatterns);
        result.scanDetails.suspiciousPatterns = suspiciousPatterns;
      }

      // 6. Image-specific security checks
      if (file.mimetype.startsWith('image/')) {
        const imageThreats = await this.scanImageFile(file);
        if (imageThreats.length > 0) {
          result.safe = false;
          result.threats.push(...imageThreats);
        }
      }

      // 7. Document-specific security checks
      if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('application/')) {
        const docThreats = await this.scanDocumentFile(file);
        if (docThreats.length > 0) {
          result.safe = false;
          result.threats.push(...docThreats);
        }
      }

      // Update metrics
      if (!result.safe) {
        this.metrics.threatsDetected++;
        result.threats.forEach(threat => this.trackThreat(threat));
      }

      const scanTime = Date.now() - startTime;
      this.updateScanTime(scanTime);

    } catch (error) {
      console.error('File scan error:', error);
      result.safe = false;
      result.threats.push('Scan error occurred');
    }

    return result;
  }

  private analyzeSuspiciousPatterns(file: Express.Multer.File): string[] {
    const threats: string[] = [];
    const content = file.buffer.toString('utf8', 0, Math.min(file.size, 10000)); // First 10KB

    // Check for script injections
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious script content detected');
        break;
      }
    }

    // Check for embedded executables
    const executablePatterns = [
      /MZ\x90\x00/,  // PE executable
      /\x7fELF/,     // ELF executable
      /\xca\xfe\xba\xbe/, // Mach-O executable
    ];

    for (const pattern of executablePatterns) {
      if (pattern.test(file.buffer.toString('binary'))) {
        threats.push('Embedded executable detected');
        break;
      }
    }

    // Check for suspicious commands
    const commandPatterns = [
      /exec\s*\(/i,
      /system\s*\(/i,
      /shell_exec\s*\(/i,
      /passthru\s*\(/i,
      /cmd\.exe/i,
      /powershell/i,
      /\$_GET\[/i,
      /\$_POST\[/i
    ];

    for (const pattern of commandPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious command patterns detected');
        break;
      }
    }

    return threats;
  }

  private async scanImageFile(file: Express.Multer.File): Promise<string[]> {
    const threats: string[] = [];

    try {
      // Check for embedded scripts in image metadata
      const content = file.buffer.toString('binary');
      
      if (content.includes('<script') || content.includes('javascript:')) {
        threats.push('Suspicious scripts found in image metadata');
      }

      // Check for polyglot files (files that are valid in multiple formats)
      if (file.mimetype.startsWith('image/') && 
          (content.includes('<?php') || content.includes('<%'))) {
        threats.push('Polyglot file detected - image with embedded code');
      }

      // Check image dimensions for pixel flood attacks
      if (file.size > 50 * 1024 * 1024) { // 50MB
        threats.push('Unusually large image file - potential pixel flood attack');
      }

    } catch (error) {
      threats.push('Image analysis failed');
    }

    return threats;
  }

  private async scanDocumentFile(file: Express.Multer.File): Promise<string[]> {
    const threats: string[] = [];

    try {
      const content = file.buffer.toString('binary', 0, Math.min(file.size, 50000));

      // Check for embedded JavaScript in PDFs
      if (file.mimetype === 'application/pdf' && content.includes('/JavaScript')) {
        threats.push('PDF contains embedded JavaScript');
      }

      // Check for suspicious PDF actions
      if (file.mimetype === 'application/pdf') {
        const suspiciousPdfPatterns = [
          '/Launch',
          '/SubmitForm',
          '/ImportData',
          '/URI',
          '/GoToR'
        ];

        for (const pattern of suspiciousPdfPatterns) {
          if (content.includes(pattern)) {
            threats.push(`Suspicious PDF action detected: ${pattern}`);
          }
        }
      }

      // Check for macro-enabled documents
      if (content.includes('vbaProject') || content.includes('macros')) {
        threats.push('Document contains macros');
      }

    } catch (error) {
      threats.push('Document analysis failed');
    }

    return threats;
  }

  private async quarantineFile(file: Express.Multer.File, scanResult: ScanResult): Promise<void> {
    try {
      const quarantineFileName = `${Date.now()}_${scanResult.fileInfo.hash}_${file.originalname}`;
      const quarantinePath = path.join(this.config.quarantinePath, quarantineFileName);
      
      await fs.writeFile(quarantinePath, file.buffer);
      
      // Create metadata file
      const metadataPath = `${quarantinePath}.json`;
      const metadata = {
        originalName: file.originalname,
        quarantineTime: new Date(),
        threats: scanResult.threats,
        fileInfo: scanResult.fileInfo,
        scanDetails: scanResult.scanDetails
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      this.metrics.quarantinedFiles++;
      
      console.warn('File quarantined:', {
        originalName: file.originalname,
        quarantinePath,
        threats: scanResult.threats
      });

    } catch (error) {
      console.error('Failed to quarantine file:', error);
    }
  }

  private async saveSecureFile(file: Express.Multer.File, scanResult: ScanResult): Promise<string> {
    // Generate secure filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const secureFileName = `${timestamp}_${randomString}${ext}`;
    const savePath = path.join(this.config.uploadPath, secureFileName);

    await fs.writeFile(savePath, file.buffer);

    // Create metadata file
    const metadataPath = `${savePath}.json`;
    const metadata = {
      originalName: file.originalname,
      uploadTime: new Date(),
      hash: scanResult.fileInfo.hash,
      size: file.size,
      mimeType: file.mimetype,
      scanResult
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return savePath;
  }

  private trackThreat(threat: string): void {
    const count = this.threatCounts.get(threat) || 0;
    this.threatCounts.set(threat, count + 1);
    this.updateTopThreats();
  }

  private updateTopThreats(): void {
    this.metrics.topThreatTypes = Array.from(this.threatCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
  }

  private updateScanTime(scanTime: number): void {
    this.metrics.averageScanTime = 
      ((this.metrics.averageScanTime * (this.metrics.scannedFiles - 1)) + scanTime) / 
      this.metrics.scannedFiles;
  }

  /**
   * Get upload security metrics
   */
  getMetrics(): FileUploadMetrics {
    return { ...this.metrics };
  }

  /**
   * Get quarantined files list
   */
  async getQuarantinedFiles(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.config.quarantinePath);
      const metadataFiles = files.filter(file => file.endsWith('.json'));
      
      const quarantinedFiles = await Promise.all(
        metadataFiles.map(async (metadataFile) => {
          try {
            const metadataPath = path.join(this.config.quarantinePath, metadataFile);
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            return metadata;
          } catch (error) {
            return null;
          }
        })
      );

      return quarantinedFiles.filter(file => file !== null);
    } catch (error) {
      console.error('Failed to get quarantined files:', error);
      return [];
    }
  }

  /**
   * Clean up old quarantined files
   */
  async cleanupQuarantine(olderThanDays: number = 30): Promise<number> {
    try {
      const files = await fs.readdir(this.config.quarantinePath);
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.config.quarantinePath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      console.log(`Cleaned up ${cleanedCount} old quarantined files`);
      return cleanedCount;
    } catch (error) {
      console.error('Quarantine cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Add custom malware signature
   */
  addMalwareSignature(name: string, hexSignature: string): void {
    this.malwareSignatures.set(name, hexSignature.toLowerCase());
  }

  /**
   * Health check for file upload security
   */
  healthCheck() {
    const metrics = this.getMetrics();
    let status = 'healthy';
    const recommendations: string[] = [];

    if (metrics.threatsDetected > 0) {
      const threatRate = (metrics.threatsDetected / metrics.totalUploads) * 100;
      if (threatRate > 5) {
        status = 'warning';
        recommendations.push('High threat detection rate. Review upload sources and security policies.');
      }
    }

    if (metrics.averageScanTime > 5000) {
      recommendations.push('File scanning is slow. Consider optimizing scan processes.');
    }

    return {
      status,
      metrics,
      recommendations,
      signatureCount: this.malwareSignatures.size,
      enabled: this.config.enabled
    };
  }
}

// Create singleton instance
export const fileUploadSecurityService = new FileUploadSecurityService({
  enabled: process.env.FILE_UPLOAD_SECURITY_ENABLED !== 'false',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || '.jpg,.png,.gif,.pdf').split(','),
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  virusScanEnabled: process.env.VIRUS_SCAN_ENABLED !== 'false',
  quarantinePath: process.env.QUARANTINE_PATH || './quarantine',
  enableMalwareSignatures: process.env.MALWARE_SIGNATURES_ENABLED !== 'false'
});