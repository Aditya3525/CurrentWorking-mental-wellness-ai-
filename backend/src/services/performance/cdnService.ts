import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  cacheMaxAge: number; // seconds
  enableAssetVersioning: boolean;
  enableImageOptimization: boolean;
  supportedImageFormats: string[];
  maxImageSize: number; // bytes
  enableAssetMinification: boolean;
}

export interface AssetMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  bytesServed: number;
  averageResponseTime: number;
  optimizedAssets: number;
}

export interface AssetOptimization {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  optimizations: string[];
}

export class CDNService {
  private config: CDNConfig;
  private metrics: AssetMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    bytesServed: 0,
    averageResponseTime: 0,
    optimizedAssets: 0
  };
  private assetCache = new Map<string, { 
    content: Buffer; 
    contentType: string; 
    etag: string; 
    lastModified: Date;
    size: number;
  }>();
  private versionMap = new Map<string, string>();

  constructor(config: CDNConfig = {
    enabled: true,
    baseUrl: process.env.CDN_BASE_URL || '',
    cacheMaxAge: 86400, // 24 hours
    enableAssetVersioning: true,
    enableImageOptimization: true,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    maxImageSize: 5 * 1024 * 1024, // 5MB
    enableAssetMinification: true
  }) {
    this.config = config;
    this.initializeAssetVersions();
  }

  private async initializeAssetVersions() {
    if (!this.config.enableAssetVersioning) return;

    try {
      // Generate version hashes for static assets
      const publicDir = path.join(process.cwd(), 'public');
      await this.generateAssetVersions(publicDir);
    } catch (error) {
      console.warn('CDN: Failed to initialize asset versions:', error);
    }
  }

  private async generateAssetVersions(dir: string, baseDir: string = dir) {
    try {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await this.generateAssetVersions(fullPath, baseDir);
        } else if (this.isStaticAsset(item)) {
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const content = await fs.readFile(fullPath);
          const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
          
          this.versionMap.set(`/${relativePath}`, hash);
        }
      }
    } catch (error) {
      console.warn(`CDN: Error generating versions for ${dir}:`, error);
    }
  }

  private isStaticAsset(filename: string): boolean {
    const extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
    return extensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Express middleware for CDN asset serving
   */
  assetMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      const startTime = Date.now();
      this.metrics.totalRequests++;

      try {
        // Check if request is for a static asset
        if (!this.isAssetRequest(req.path)) {
          return next();
        }

        // Handle asset versioning
        const assetPath = this.resolveAssetPath(req.path);
        
        // Check cache first
        const cached = this.assetCache.get(assetPath);
        if (cached && this.isAssetFresh(req, cached)) {
          this.metrics.cacheHits++;
          this.metrics.bytesServed += cached.size;
          
          this.setAssetHeaders(res, cached, true);
          
          if (req.headers['if-none-match'] === cached.etag) {
            res.status(304).end();
          } else {
            res.end(cached.content);
          }
          
          this.updateResponseTime(Date.now() - startTime);
          return;
        }

        this.metrics.cacheMisses++;

        // Load and optimize asset
        const asset = await this.loadAndOptimizeAsset(assetPath);
        if (!asset) {
          return next();
        }

        // Cache the asset
        this.assetCache.set(assetPath, asset);

        // Set headers and send
        this.setAssetHeaders(res, asset, false);
        this.metrics.bytesServed += asset.size;
        
        res.end(asset.content);
        this.updateResponseTime(Date.now() - startTime);

      } catch (error) {
        console.error('CDN: Asset serving error:', error);
        next();
      }
    };
  }

  private isAssetRequest(path: string): boolean {
    return /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot)$/i.test(path);
  }

  private resolveAssetPath(requestPath: string): string {
    // Remove version hash from path if present
    const cleanPath = requestPath.replace(/\.[a-f0-9]{8}\./, '.');
    return path.join(process.cwd(), 'public', cleanPath);
  }

  private isAssetFresh(req: Request, cached: any): boolean {
    // Check If-Modified-Since header
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince) {
      const modifiedSince = new Date(ifModifiedSince);
      if (cached.lastModified <= modifiedSince) {
        return true;
      }
    }

    // Check ETag
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === cached.etag) {
      return true;
    }

    return false;
  }

  private async loadAndOptimizeAsset(assetPath: string): Promise<any | null> {
    try {
      const stat = await fs.stat(assetPath);
      let content = await fs.readFile(assetPath);
      
      const ext = path.extname(assetPath).toLowerCase();
      const contentType = this.getContentType(ext);
      
      // Optimize asset if possible
      if (this.shouldOptimize(ext)) {
        const optimized = await this.optimizeAsset(content, ext);
        if (optimized) {
          content = optimized.content;
          this.metrics.optimizedAssets++;
        }
      }

      // Generate ETag
      const etag = `"${crypto.createHash('md5').update(content).digest('hex')}"`;

      return {
        content,
        contentType,
        etag,
        lastModified: stat.mtime,
        size: content.length
      };

    } catch (error) {
      console.error(`CDN: Error loading asset ${assetPath}:`, error);
      return null;
    }
  }

  private shouldOptimize(ext: string): boolean {
    if (!this.config.enableAssetMinification && !this.config.enableImageOptimization) {
      return false;
    }

    const minifiableTypes = ['.js', '.css', '.html', '.json'];
    const imageTypes = ['.jpg', '.jpeg', '.png', '.webp'];

    return (this.config.enableAssetMinification && minifiableTypes.includes(ext)) ||
           (this.config.enableImageOptimization && imageTypes.includes(ext));
  }

  private async optimizeAsset(content: Buffer, ext: string): Promise<{ content: Buffer; optimization: AssetOptimization } | null> {
    try {
      const originalSize = content.length;
      let optimizedContent = content;
      const optimizations: string[] = [];

      // Minify CSS/JS
      if (['.css', '.js'].includes(ext) && this.config.enableAssetMinification) {
        optimizedContent = await this.minifyAsset(content, ext);
        optimizations.push('minification');
      }

      // Optimize images
      if (this.config.enableImageOptimization && this.isImageType(ext)) {
        const imageOptimized = await this.optimizeImage(content, ext);
        if (imageOptimized) {
          optimizedContent = imageOptimized;
          optimizations.push('image_compression');
        }
      }

      if (optimizedContent.length >= originalSize) {
        return null; // No improvement
      }

      return {
        content: optimizedContent,
        optimization: {
          originalSize,
          optimizedSize: optimizedContent.length,
          compressionRatio: ((originalSize - optimizedContent.length) / originalSize) * 100,
          format: ext,
          optimizations
        }
      };

    } catch (error) {
      console.error('CDN: Asset optimization error:', error);
      return null;
    }
  }

  private async minifyAsset(content: Buffer, ext: string): Promise<Buffer> {
    const text = content.toString('utf8');
    let minified = text;

    if (ext === '.css') {
      // Simple CSS minification
      minified = text
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
        .replace(/\s*{\s*/g, '{') // Clean braces
        .replace(/;\s*/g, ';') // Clean semicolons
        .trim();
    } else if (ext === '.js') {
      // Simple JS minification (basic)
      minified = text
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*([{}();,])\s*/g, '$1') // Clean punctuation
        .trim();
    }

    return Buffer.from(minified, 'utf8');
  }

  private async optimizeImage(content: Buffer, ext: string): Promise<Buffer | null> {
    // This is a placeholder for image optimization
    // In a real implementation, you would use libraries like:
    // - sharp for image processing
    // - imagemin for optimization
    // - For now, we'll just return null (no optimization)
    
    if (content.length > this.config.maxImageSize) {
      console.warn(`CDN: Image too large for optimization: ${content.length} bytes`);
      return null;
    }

    // TODO: Implement actual image optimization
    // Example with sharp:
    // const sharp = require('sharp');
    // return await sharp(content)
    //   .jpeg({ quality: 80 })
    //   .png({ compressionLevel: 9 })
    //   .webp({ quality: 80 })
    //   .toBuffer();

    return null;
  }

  private isImageType(ext: string): boolean {
    return this.config.supportedImageFormats.some(format => 
      ext.toLowerCase().includes(format)
    );
  }

  private getContentType(ext: string): string {
    const types: { [key: string]: string } = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };

    return types[ext] || 'application/octet-stream';
  }

  private setAssetHeaders(res: Response, asset: any, fromCache: boolean): void {
    // Set caching headers
    res.setHeader('Cache-Control', `public, max-age=${this.config.cacheMaxAge}`);
    res.setHeader('ETag', asset.etag);
    res.setHeader('Last-Modified', asset.lastModified.toUTCString());
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Content-Length', asset.size);

    // Set CDN headers
    if (this.config.baseUrl) {
      res.setHeader('X-CDN-Cache', fromCache ? 'HIT' : 'MISS');
    }

    // Security headers for assets
    if (asset.contentType.includes('javascript') || asset.contentType.includes('css')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }

  private updateResponseTime(duration: number): void {
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (this.metrics.totalRequests - 1)) + duration) / 
      this.metrics.totalRequests;
  }

  /**
   * Generate versioned URL for asset
   */
  getAssetUrl(assetPath: string): string {
    if (!this.config.enableAssetVersioning) {
      return this.config.baseUrl + assetPath;
    }

    const version = this.versionMap.get(assetPath);
    if (version) {
      const ext = path.extname(assetPath);
      const baseName = path.basename(assetPath, ext);
      const dir = path.dirname(assetPath);
      const versionedPath = `${dir}/${baseName}.${version}${ext}`;
      return this.config.baseUrl + versionedPath;
    }

    return this.config.baseUrl + assetPath;
  }

  /**
   * Preload critical assets
   */
  async preloadAssets(assetPaths: string[]): Promise<void> {
    console.log('CDN: Preloading critical assets...');
    
    const preloadPromises = assetPaths.map(async (assetPath) => {
      try {
        const fullPath = path.join(process.cwd(), 'public', assetPath);
        const asset = await this.loadAndOptimizeAsset(fullPath);
        
        if (asset) {
          this.assetCache.set(fullPath, asset);
        }
      } catch (error) {
        console.warn(`CDN: Failed to preload asset ${assetPath}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log(`CDN: Preloaded ${assetPaths.length} assets`);
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    this.assetCache.clear();
    console.log('CDN: Asset cache cleared');
  }

  /**
   * Get CDN metrics
   */
  getMetrics(): AssetMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const hitRate = this.metrics.totalRequests > 0 ? 
      (this.metrics.cacheHits / this.metrics.totalRequests) * 100 : 0;

    return {
      cacheSize: this.assetCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSize: Array.from(this.assetCache.values()).reduce((sum, asset) => sum + asset.size, 0),
      ...this.metrics
    };
  }

  /**
   * Health check for CDN service
   */
  async healthCheck(): Promise<{ status: string; metrics: any; recommendations: string[] }> {
    const metrics = this.getMetrics();
    const cacheStats = this.getCacheStats();
    const recommendations: string[] = [];
    let status = 'healthy';

    // Check cache hit rate
    if (cacheStats.hitRate < 70) {
      status = 'warning';
      recommendations.push('Low cache hit rate. Consider increasing cache TTL or preloading more assets.');
    }

    // Check average response time
    if (metrics.averageResponseTime > 100) {
      status = 'warning';
      recommendations.push('High average response time for assets. Consider optimizing asset delivery.');
    }

    // Check optimization rate
    const optimizationRate = metrics.totalRequests > 0 ? 
      (metrics.optimizedAssets / metrics.totalRequests) * 100 : 0;

    if (optimizationRate < 50) {
      recommendations.push('Low asset optimization rate. Enable minification and image optimization.');
    }

    return {
      status,
      metrics: {
        ...metrics,
        cacheHitRate: cacheStats.hitRate,
        optimizationRate: Math.round(optimizationRate * 100) / 100
      },
      recommendations
    };
  }

  /**
   * Generate critical resource hints
   */
  generateResourceHints(criticalAssets: string[]): string[] {
    const hints: string[] = [];

    for (const asset of criticalAssets) {
      const assetUrl = this.getAssetUrl(asset);
      const ext = path.extname(asset).toLowerCase();

      if (['.css'].includes(ext)) {
        hints.push(`<link rel="preload" href="${assetUrl}" as="style">`);
      } else if (['.js'].includes(ext)) {
        hints.push(`<link rel="preload" href="${assetUrl}" as="script">`);
      } else if (this.isImageType(ext)) {
        hints.push(`<link rel="preload" href="${assetUrl}" as="image">`);
      } else if (['.woff', '.woff2'].includes(ext)) {
        hints.push(`<link rel="preload" href="${assetUrl}" as="font" crossorigin>`);
      }
    }

    return hints;
  }
}

// Create singleton instance
export const cdnService = new CDNService({
  enabled: process.env.CDN_ENABLED !== 'false',
  baseUrl: process.env.CDN_BASE_URL || '',
  cacheMaxAge: parseInt(process.env.CDN_CACHE_MAX_AGE || '86400'),
  enableAssetVersioning: process.env.CDN_ASSET_VERSIONING !== 'false',
  enableImageOptimization: process.env.CDN_IMAGE_OPTIMIZATION !== 'false',
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
  maxImageSize: parseInt(process.env.CDN_MAX_IMAGE_SIZE || '5242880'),
  enableAssetMinification: process.env.CDN_MINIFICATION !== 'false'
});