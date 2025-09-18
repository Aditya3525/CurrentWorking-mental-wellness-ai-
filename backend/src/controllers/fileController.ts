import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';

const prisma = new PrismaClient();

// File validation constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 100 * 1024 * 1024, // 100MB
  video: 500 * 1024 * 1024, // 500MB
  document: 50 * 1024 * 1024 // 50MB
};

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads/images',
    'uploads/images/thumbnails',
    'uploads/audio',
    'uploads/video',
    'uploads/documents',
    'uploads/temp'
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Initialize upload directories
ensureUploadDirs();

// Multer configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath = 'uploads/temp';

    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      uploadPath = 'uploads/images';
    } else if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      uploadPath = 'uploads/audio';
    } else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      uploadPath = 'uploads/video';
    } else if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      uploadPath = 'uploads/documents';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const hash = crypto.createHash('md5').update(file.originalname + uniqueSuffix).digest('hex');
    const ext = path.extname(file.originalname);
    cb(null, hash + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_AUDIO_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_DOCUMENT_TYPES
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(MAX_FILE_SIZE))
  }
});

// Utility functions
const getFileType = (mimetype: string): string => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'image';
  if (ALLOWED_AUDIO_TYPES.includes(mimetype)) return 'audio';
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return 'video';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) return 'document';
  return 'unknown';
};

const validateFileSize = (file: Express.Multer.File): boolean => {
  const fileType = getFileType(file.mimetype);
  const maxSize = MAX_FILE_SIZE[fileType as keyof typeof MAX_FILE_SIZE];
  return file.size <= maxSize;
};

const generateThumbnail = async (imagePath: string, outputPath: string): Promise<void> => {
  await sharp(imagePath)
    .resize(300, 300, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
};

const optimizeImage = async (inputPath: string, outputPath: string): Promise<void> => {
  const stats = await fs.stat(inputPath);
  const fileSizeInMB = stats.size / (1024 * 1024);

  let quality = 90;
  if (fileSizeInMB > 5) quality = 70;
  if (fileSizeInMB > 10) quality = 60;

  await sharp(inputPath)
    .resize(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality })
    .toFile(outputPath);
};

const getAudioMetadata = (filePath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          duration: metadata.format.duration,
          bitRate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          size: metadata.format.size
        });
      }
    });
  });
};

const getVideoMetadata = (filePath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        resolve({
          duration: metadata.format.duration,
          bitRate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          size: metadata.format.size,
          video: videoStream ? {
            width: videoStream.width,
            height: videoStream.height,
            codec: videoStream.codec_name,
            frameRate: eval(videoStream.r_frame_rate || '0')
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels
          } : null
        });
      }
    });
  });
};

// Controller functions
export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const file = req.file;
    const fileType = getFileType(file.mimetype);

    // Validate file size
    if (!validateFileSize(file)) {
      await fs.unlink(file.path); // Clean up uploaded file
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum allowed size for ${fileType} files`
      });
    }

    let metadata: any = {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };

    let thumbnailPath: string | null = null;
    let optimizedPath: string | null = null;

    try {
      // Process based on file type
      switch (fileType) {
        case 'image':
          // Generate thumbnail
          const thumbnailName = `thumb_${file.filename}`;
          thumbnailPath = path.join('uploads/images/thumbnails', thumbnailName);
          await generateThumbnail(file.path, thumbnailPath);

          // Optimize image
          const optimizedName = `opt_${file.filename}`;
          optimizedPath = path.join('uploads/images', optimizedName);
          await optimizeImage(file.path, optimizedPath);

          // Get image dimensions
          const imageMetadata = await sharp(file.path).metadata();
          metadata.width = imageMetadata.width;
          metadata.height = imageMetadata.height;
          metadata.format = imageMetadata.format;
          break;

        case 'audio':
          // Get audio metadata
          const audioMeta = await getAudioMetadata(file.path);
          metadata = { ...metadata, ...audioMeta };
          break;

        case 'video':
          // Get video metadata
          const videoMeta = await getVideoMetadata(file.path);
          metadata = { ...metadata, ...videoMeta };
          break;

        case 'document':
          // For documents, we just store basic info
          break;
      }

      // Save file record to database
      const fileRecord = await prisma.file.create({
        data: {
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          type: fileType,
          metadata,
          thumbnailPath,
          optimizedPath,
          uploadedById: userId,
          isPublic: false
        }
      });

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          filename: fileRecord.filename,
          path: fileRecord.path,
          type: fileRecord.type,
          size: fileRecord.size,
          mimetype: fileRecord.mimetype,
          metadata: fileRecord.metadata,
          thumbnailPath: fileRecord.thumbnailPath,
          optimizedPath: fileRecord.optimizedPath,
          url: `/api/files/${fileRecord.id}`,
          thumbnailUrl: thumbnailPath ? `/api/files/${fileRecord.id}/thumbnail` : null
        }
      });

    } catch (processingError) {
      console.error('File processing error:', processingError);
      // Clean up uploaded file on processing error
      await fs.unlink(file.path);
      if (thumbnailPath) {
        try { await fs.unlink(thumbnailPath); } catch (e) { /* ignore */ }
      }
      if (optimizedPath) {
        try { await fs.unlink(optimizedPath); } catch (e) { /* ignore */ }
      }
      throw processingError;
    }

  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

export const uploadMultipleFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of files) {
      try {
        const fileType = getFileType(file.mimetype);

        if (!validateFileSize(file)) {
          await fs.unlink(file.path);
          errors.push({
            filename: file.originalname,
            error: `File size exceeds maximum allowed size for ${fileType} files`
          });
          continue;
        }

        let metadata: any = {
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };

        let thumbnailPath: string | null = null;
        let optimizedPath: string | null = null;

        // Process file based on type
        if (fileType === 'image') {
          const thumbnailName = `thumb_${file.filename}`;
          thumbnailPath = path.join('uploads/images/thumbnails', thumbnailName);
          await generateThumbnail(file.path, thumbnailPath);

          const optimizedName = `opt_${file.filename}`;
          optimizedPath = path.join('uploads/images', optimizedName);
          await optimizeImage(file.path, optimizedPath);

          const imageMetadata = await sharp(file.path).metadata();
          metadata.width = imageMetadata.width;
          metadata.height = imageMetadata.height;
          metadata.format = imageMetadata.format;
        } else if (fileType === 'audio') {
          const audioMeta = await getAudioMetadata(file.path);
          metadata = { ...metadata, ...audioMeta };
        } else if (fileType === 'video') {
          const videoMeta = await getVideoMetadata(file.path);
          metadata = { ...metadata, ...videoMeta };
        }

        const fileRecord = await prisma.file.create({
          data: {
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            type: fileType,
            metadata,
            thumbnailPath,
            optimizedPath,
            uploadedById: userId,
            isPublic: false
          }
        });

        uploadResults.push({
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          filename: fileRecord.filename,
          type: fileRecord.type,
          size: fileRecord.size,
          url: `/api/files/${fileRecord.id}`,
          thumbnailUrl: thumbnailPath ? `/api/files/${fileRecord.id}/thumbnail` : null
        });

      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        await fs.unlink(file.path);
        errors.push({
          filename: file.originalname,
          error: 'Processing failed'
        });
      }
    }

    res.json({
      success: true,
      message: `${uploadResults.length} files uploaded successfully`,
      data: {
        uploaded: uploadResults,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    next(error);
  }
};

export const getFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { download } = req.query;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { name: true }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file is public or user has access
    const userId = (req as any).user?.id;
    if (!file.isPublic && (!userId || file.uploadedById !== userId)) {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId || '' },
        select: { role: true }
      });

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    try {
      await fs.access(file.path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.mimetype);
    
    if (download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    }

    // Stream the file
    const fileStream = require('fs').createReadStream(file.path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Get file error:', error);
    next(error);
  }
};

export const getFileThumbnail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file || !file.thumbnailPath) {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail not found'
      });
    }

    try {
      await fs.access(file.thumbnailPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail file not found on server'
      });
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    const thumbnailStream = require('fs').createReadStream(file.thumbnailPath);
    thumbnailStream.pipe(res);

  } catch (error) {
    console.error('Get thumbnail error:', error);
    next(error);
  }
};

export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
      page = '1',
      limit = '20',
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      uploadedById: userId
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.originalName = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          uploadedBy: {
            select: { name: true }
          }
        }
      }),
      prisma.file.count({ where })
    ]);

    const filesWithUrls = files.map(file => ({
      ...file,
      url: `/api/files/${file.id}`,
      thumbnailUrl: file.thumbnailPath ? `/api/files/${file.id}/thumbnail` : null,
      downloadUrl: `/api/files/${file.id}?download=true`
    }));

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        files: filesWithUrls,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    next(error);
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check ownership or admin access
    if (file.uploadedById !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id }
    });

    // Delete physical files
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Error deleting main file:', error);
    }

    if (file.thumbnailPath) {
      try {
        await fs.unlink(file.thumbnailPath);
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
    }

    if (file.optimizedPath) {
      try {
        await fs.unlink(file.optimizedPath);
      } catch (error) {
        console.error('Error deleting optimized file:', error);
      }
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    next(error);
  }
};

export const updateFileMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, tags, isPublic } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check ownership or admin access
    if (file.uploadedById !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        title: title || file.title,
        description: description || file.description,
        tags: tags || file.tags,
        isPublic: isPublic !== undefined ? isPublic : file.isPublic
      }
    });

    res.json({
      success: true,
      message: 'File metadata updated successfully',
      data: {
        ...updatedFile,
        url: `/api/files/${updatedFile.id}`,
        thumbnailUrl: updatedFile.thumbnailPath ? `/api/files/${updatedFile.id}/thumbnail` : null
      }
    });

  } catch (error) {
    console.error('Update file metadata error:', error);
    next(error);
  }
};

export const getFileAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const [
      totalFiles,
      totalSize,
      filesByType,
      recentUploads,
      largestFiles
    ] = await Promise.all([
      prisma.file.count(),
      prisma.file.aggregate({
        _sum: { size: true }
      }),
      prisma.file.groupBy({
        by: ['type'],
        _count: { _all: true },
        _sum: { size: true }
      }),
      prisma.file.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { name: true }
          }
        }
      }),
      prisma.file.findMany({
        take: 10,
        orderBy: { size: 'desc' },
        include: {
          uploadedBy: {
            select: { name: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalFiles,
          totalSize: totalSize._sum.size || 0,
          averageFileSize: totalFiles > 0 ? (totalSize._sum.size || 0) / totalFiles : 0
        },
        filesByType: filesByType.map(type => ({
          type: type.type,
          count: type._count._all,
          totalSize: type._sum.size || 0
        })),
        recentUploads: recentUploads.map(file => ({
          id: file.id,
          originalName: file.originalName,
          type: file.type,
          size: file.size,
          uploadedBy: file.uploadedBy.name,
          createdAt: file.createdAt
        })),
        largestFiles: largestFiles.map(file => ({
          id: file.id,
          originalName: file.originalName,
          type: file.type,
          size: file.size,
          uploadedBy: file.uploadedBy.name
        }))
      }
    });

  } catch (error) {
    console.error('File analytics error:', error);
    next(error);
  }
};