import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

export interface CompressionConfig {
  enabled: boolean;
  threshold: number; // Minimum size in bytes to compress
  algorithms: ('gzip' | 'deflate' | 'brotli')[];
  level: number; // Compression level 1-9
  chunkSize: number;
}

export interface CompressionMetrics {
  totalRequests: number;
  compressedRequests: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  averageCompressionTime: number;
}

export class CompressionService {
  private config: CompressionConfig;
  private metrics: CompressionMetrics = {
    totalRequests: 0,
    compressedRequests: 0,
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    averageCompressionTime: 0
  };

  constructor(config: CompressionConfig = {
    enabled: true,
    threshold: 1024, // 1KB
    algorithms: ['brotli', 'gzip', 'deflate'],
    level: 6,
    chunkSize: 16384
  }) {
    this.config = config;
  }

  /**
   * Express middleware for response compression
   */
  compressionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      // Skip compression for certain content types
      const skipTypes = ['image/', 'video/', 'audio/', 'application/zip', 'application/gzip'];
      const contentType = res.getHeader('content-type') as string;
      
      if (contentType && skipTypes.some(type => contentType.includes(type))) {
        return next();
      }

      // Store original write and end methods
      const originalWrite = res.write;
      const originalEnd = res.end;
      let chunks: Buffer[] = [];
      let totalSize = 0;

      // Override write method to collect chunks
      res.write = function(chunk: any, encoding?: any) {
        if (chunk) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
          chunks.push(buffer);
          totalSize += buffer.length;
        }
        return true;
      };

      // Override end method to compress and send
      res.end = function(chunk?: any, encoding?: any) {
        if (chunk) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
          chunks.push(buffer);
          totalSize += buffer.length;
        }

        // Combine all chunks
        const fullBuffer = Buffer.concat(chunks);
        
        // Check if size meets threshold
        if (totalSize < this.config.threshold) {
          res.write = originalWrite;
          res.end = originalEnd;
          return originalEnd.call(this, fullBuffer);
        }

        // Compress the content
        this.compressResponse(req, res, fullBuffer, originalWrite, originalEnd);
      }.bind(this);

      next();
    };
  }

  private async compressResponse(
    req: Request,
    res: Response,
    content: Buffer,
    originalWrite: Function,
    originalEnd: Function
  ) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Determine best compression algorithm based on Accept-Encoding header
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const algorithm = this.selectCompressionAlgorithm(acceptEncoding);

      if (!algorithm) {
        // No compression supported by client
        res.write = originalWrite;
        res.end = originalEnd;
        return originalEnd.call(res, content);
      }

      // Compress content
      const compressed = await this.compress(content, algorithm);
      
      // Update metrics
      this.updateMetrics(content.length, compressed.length, Date.now() - startTime);

      // Set appropriate headers
      res.setHeader('Content-Encoding', algorithm);
      res.setHeader('Content-Length', compressed.length);
      res.setHeader('Vary', 'Accept-Encoding');

      // Send compressed content
      res.write = originalWrite;
      res.end = originalEnd;
      originalEnd.call(res, compressed);

    } catch (error) {
      console.error('Compression error:', error);
      // Fallback to uncompressed
      res.write = originalWrite;
      res.end = originalEnd;
      originalEnd.call(res, content);
    }
  }

  private selectCompressionAlgorithm(acceptEncoding: string): string | null {
    const supported = this.config.algorithms;
    
    // Check in order of preference (best compression first)
    if (acceptEncoding.includes('br') && supported.includes('brotli')) {
      return 'br';
    }
    if (acceptEncoding.includes('gzip') && supported.includes('gzip')) {
      return 'gzip';
    }
    if (acceptEncoding.includes('deflate') && supported.includes('deflate')) {
      return 'deflate';
    }
    
    return null;
  }

  private async compress(content: Buffer, algorithm: string): Promise<Buffer> {
    const options = {
      level: this.config.level,
      chunkSize: this.config.chunkSize
    };

    switch (algorithm) {
      case 'br':
        return await brotliCompress(content, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.level
          }
        });
      case 'gzip':
        return await gzip(content, options);
      case 'deflate':
        return await deflate(content, options);
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  private updateMetrics(originalSize: number, compressedSize: number, compressionTime: number) {
    this.metrics.compressedRequests++;
    this.metrics.originalSize += originalSize;
    this.metrics.compressedSize += compressedSize;
    
    // Calculate compression ratio
    if (this.metrics.originalSize > 0) {
      this.metrics.compressionRatio = 
        ((this.metrics.originalSize - this.metrics.compressedSize) / this.metrics.originalSize) * 100;
    }

    // Calculate average compression time
    this.metrics.averageCompressionTime = 
      ((this.metrics.averageCompressionTime * (this.metrics.compressedRequests - 1)) + compressionTime) / 
      this.metrics.compressedRequests;
  }

  /**
   * Compress data manually
   */
  async compressData(data: string | Buffer, algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip'): Promise<Buffer> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return await this.compress(buffer, algorithm === 'brotli' ? 'br' : algorithm);
  }

  /**
   * Decompress data
   */
  async decompressData(data: Buffer, algorithm: 'gzip' | 'deflate' | 'brotli'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let decompressStream;
      
      switch (algorithm) {
        case 'gzip':
          decompressStream = zlib.createGunzip();
          break;
        case 'deflate':
          decompressStream = zlib.createInflate();
          break;
        case 'brotli':
          decompressStream = zlib.createBrotliDecompress();
          break;
        default:
          return reject(new Error(`Unsupported decompression algorithm: ${algorithm}`));
      }

      const chunks: Buffer[] = [];
      
      decompressStream.on('data', (chunk) => chunks.push(chunk));
      decompressStream.on('end', () => resolve(Buffer.concat(chunks)));
      decompressStream.on('error', reject);
      
      decompressStream.end(data);
    });
  }

  /**
   * Get compression metrics
   */
  getMetrics(): CompressionMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      compressedRequests: 0,
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      averageCompressionTime: 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CompressionConfig {
    return { ...this.config };
  }

  /**
   * Check if content should be compressed
   */
  shouldCompress(size: number, contentType?: string): boolean {
    if (!this.config.enabled || size < this.config.threshold) {
      return false;
    }

    // Skip binary content types
    const skipTypes = ['image/', 'video/', 'audio/', 'application/zip', 'application/gzip'];
    if (contentType && skipTypes.some(type => contentType.includes(type))) {
      return false;
    }

    return true;
  }

  /**
   * Estimate compression ratio for content type
   */
  estimateCompressionRatio(contentType?: string): number {
    // Estimated compression ratios based on content type
    const ratios: { [key: string]: number } = {
      'text/html': 0.75,
      'text/css': 0.80,
      'text/javascript': 0.70,
      'application/javascript': 0.70,
      'application/json': 0.85,
      'text/plain': 0.60,
      'text/xml': 0.75,
      'application/xml': 0.75,
      'default': 0.70
    };

    if (!contentType) return ratios.default;

    for (const [type, ratio] of Object.entries(ratios)) {
      if (contentType.includes(type)) {
        return ratio;
      }
    }

    return ratios.default;
  }

  /**
   * Optimize compression settings for content type
   */
  getOptimalSettings(contentType?: string): { algorithm: string; level: number } {
    // Optimize based on content type
    if (contentType?.includes('text/html') || contentType?.includes('text/xml')) {
      return { algorithm: 'brotli', level: 6 };
    }
    
    if (contentType?.includes('javascript') || contentType?.includes('css')) {
      return { algorithm: 'brotli', level: 8 };
    }
    
    if (contentType?.includes('json')) {
      return { algorithm: 'gzip', level: 6 };
    }

    return { algorithm: 'gzip', level: this.config.level };
  }
}

// Create singleton instance
export const compressionService = new CompressionService({
  enabled: process.env.COMPRESSION_ENABLED !== 'false',
  threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024'),
  algorithms: ['brotli', 'gzip', 'deflate'],
  level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
  chunkSize: parseInt(process.env.COMPRESSION_CHUNK_SIZE || '16384')
});