import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  File, 
  Image as ImageIcon, 
  Video, 
  Headphones,
  FileText,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Cloud,
  HardDrive,
  Zap,
  Shield,
  Clock,
  Play,
  Pause,
  Volume2
} from 'lucide-react';

// Types
interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'other';
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  uploadedAt?: Date;
  metadata?: FileMetadata;
}

interface FileMetadata {
  duration?: string;
  dimensions?: { width: number; height: number };
  bitrate?: string;
  codec?: string;
  pages?: number;
  fileSize: number;
  mimeType: string;
}

interface UploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
  enableThumbnails: boolean;
  enableCDN: boolean;
  chunkSize?: number;
}

interface FileUploadSystemProps {
  onFilesUploaded?: (files: UploadFile[]) => void;
  config?: Partial<UploadConfig>;
  initialFiles?: UploadFile[];
  showPreview?: boolean;
  enableBulkUpload?: boolean;
}

const defaultConfig: UploadConfig = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg',
    'application/pdf', 'text/plain', 'text/markdown'
  ],
  maxFiles: 10,
  enableThumbnails: true,
  enableCDN: true,
  chunkSize: 1024 * 1024 // 1MB chunks
};

export const FileUploadSystem: React.FC<FileUploadSystemProps> = ({
  onFilesUploaded,
  config = {},
  initialFiles = [],
  showPreview = true,
  enableBulkUpload = true
}) => {
  const [files, setFiles] = useState<UploadFile[]>(initialFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    totalFiles: 0,
    completedFiles: 0,
    totalSize: 0,
    uploadedSize: 0
  });
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null);
  const [previewMode, setPreviewMode] = useState<'grid' | 'list'>('grid');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (files.length > 0) {
      onFilesUploaded?.(files.filter(f => f.status === 'completed'));
    }
  }, [files, onFilesUploaded]);

  const getCategoryFromMimeType = (mimeType: string): UploadFile['category'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return 'document';
    return 'other';
  };

  const validateFile = (file: File): string | null => {
    if (file.size > uploadConfig.maxFileSize) {
      return `File too large. Maximum size is ${formatFileSize(uploadConfig.maxFileSize)}`;
    }
    
    if (!uploadConfig.allowedTypes.includes(file.type)) {
      return `File type not supported. Allowed types: ${uploadConfig.allowedTypes.join(', ')}`;
    }
    
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateThumbnail = async (file: File): Promise<string | null> => {
    if (!uploadConfig.enableThumbnails) return null;
    
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const maxSize = 200;
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL());
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(video.duration / 2, 5); // Seek to middle or 5s
        };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = 200;
          canvas.height = (video.videoHeight / video.videoWidth) * 200;
          
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        };
        video.src = URL.createObjectURL(file);
      } else {
        resolve(null);
      }
    });
  };

  const extractMetadata = async (file: File): Promise<FileMetadata> => {
    const metadata: FileMetadata = {
      fileSize: file.size,
      mimeType: file.type
    };

    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          metadata.dimensions = { width: img.width, height: img.height };
          resolve(metadata);
        };
        img.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          metadata.duration = formatDuration(video.duration);
          metadata.dimensions = { width: video.videoWidth, height: video.videoHeight };
          resolve(metadata);
        };
        video.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.onloadedmetadata = () => {
          metadata.duration = formatDuration(audio.duration);
          resolve(metadata);
        };
        audio.src = URL.createObjectURL(file);
      } else {
        resolve(metadata);
      }
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const simulateUpload = async (uploadFile: UploadFile): Promise<void> => {
    const { file } = uploadFile;
    const chunkSize = uploadConfig.chunkSize || 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    // Simulate chunk upload with progress
    for (let i = 0; i < totalChunks; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress, status: 'uploading' }
          : f
      ));
    }

    // Simulate processing phase
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'processing', progress: 100 }
        : f
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate thumbnail and extract metadata
    const [thumbnailUrl, metadata] = await Promise.all([
      generateThumbnail(file),
      extractMetadata(file)
    ]);

    // Simulate CDN upload completion
    const mockUrl = `https://cdn.mentalwellbeing.app/uploads/${Date.now()}-${file.name}`;
    
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { 
            ...f, 
            status: 'completed', 
            url: mockUrl,
            thumbnailUrl,
            metadata,
            uploadedAt: new Date()
          }
        : f
    ));
  };

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = [];
    const filesArray = Array.from(fileList);

    // Validate and create upload file objects
    for (const file of filesArray) {
      const error = validateFile(file);
      if (error) {
        // Show error for invalid files
        console.error(`File ${file.name}: ${error}`);
        continue;
      }

      const uploadFile: UploadFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        category: getCategoryFromMimeType(file.type),
        progress: 0,
        status: 'pending'
      };

      newFiles.push(uploadFile);
    }

    if (newFiles.length === 0) return;

    // Check max files limit
    if (files.length + newFiles.length > uploadConfig.maxFiles) {
      alert(`Cannot upload more than ${uploadConfig.maxFiles} files`);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Update stats
    setUploadStats(prev => ({
      ...prev,
      totalFiles: prev.totalFiles + newFiles.length,
      totalSize: prev.totalSize + newFiles.reduce((sum, f) => sum + f.size, 0)
    }));

    // Start uploads
    try {
      await Promise.all(newFiles.map(uploadFile => simulateUpload(uploadFile)));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [files.length, uploadConfig.maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  const retryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'pending', progress: 0, error: undefined }
          : f
      ));
      simulateUpload(file);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
    setSelectedFile(null);
  };

  const getFileIcon = (category: UploadFile['category']) => {
    switch (category) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Headphones className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'uploading': case 'processing': return 'text-blue-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (file: UploadFile) => {
    switch (file.status) {
      case 'completed': return <Check className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'uploading': case 'processing': 
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={enableBulkUpload}
          accept={uploadConfig.allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`p-3 rounded-full ${isDragging ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              {isDragging ? 'Drop files here' : 'Upload Files'}
            </h3>
            <p className="text-gray-400 mb-4">
              Drag and drop files or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                browse
              </button>
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>Max {formatFileSize(uploadConfig.maxFileSize)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <File className="w-4 h-4" />
                <span>Up to {uploadConfig.maxFiles} files</span>
              </div>
              {uploadConfig.enableCDN && (
                <div className="flex items-center space-x-1">
                  <Cloud className="w-4 h-4" />
                  <span>CDN Storage</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Stats */}
      {(files.length > 0 || isUploading) && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Upload Progress</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode(previewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                {previewMode === 'grid' ? 'List' : 'Grid'}
              </button>
              <button
                onClick={clearCompleted}
                className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                Clear Completed
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{files.length}</p>
              <p className="text-sm text-gray-400">Total Files</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {files.filter(f => f.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {files.filter(f => f.status === 'uploading' || f.status === 'processing').length}
              </p>
              <p className="text-sm text-gray-400">Processing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {files.filter(f => f.status === 'error').length}
              </p>
              <p className="text-sm text-gray-400">Failed</p>
            </div>
          </div>

          {/* Overall Progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                <span>Overall Progress</span>
                <span>{Math.round((files.filter(f => f.status === 'completed').length / files.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(files.filter(f => f.status === 'completed').length / files.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Files</h3>
          </div>
          
          {previewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-gray-750 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => setSelectedFile(file)}
                >
                  {/* File Preview */}
                  <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                    {file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-500">
                        {getFileIcon(file.category)}
                      </div>
                    )}
                    
                    {/* Status Overlay */}
                    <div className="absolute top-2 right-2">
                      {getStatusIcon(file)}
                    </div>
                    
                    {/* Progress Bar */}
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 p-2">
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          {file.status === 'processing' ? 'Processing...' : `${file.progress}%`}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </span>
                      <span className={`text-xs capitalize ${getStatusColor(file.status)}`}>
                        {file.status}
                      </span>
                    </div>
                    
                    {file.error && (
                      <p className="text-xs text-red-400 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="px-3 pb-3 flex items-center justify-end space-x-2">
                    {file.status === 'error' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); retryUpload(file.id); }}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Retry"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    {file.status === 'completed' && file.url && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }}
                          className="p-1 text-gray-400 hover:text-gray-300"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const a = document.createElement('a');
                            a.href = file.url!;
                            a.download = file.name;
                            a.click();
                          }}
                          className="p-1 text-gray-400 hover:text-gray-300"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      className="p-1 text-red-400 hover:text-red-300"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span className="capitalize">{file.type}</span>
                        {file.metadata?.duration && (
                          <span>{file.metadata.duration}</span>
                        )}
                        {file.uploadedAt && (
                          <span>{file.uploadedAt.toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      {/* Progress for uploading files */}
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {file.error && (
                        <p className="text-sm text-red-400 mt-1">{file.error}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm capitalize ${getStatusColor(file.status)}`}>
                        {file.status}
                      </div>
                      {getStatusIcon(file)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {file.status === 'error' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); retryUpload(file.id); }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded"
                          title="Retry"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      {file.status === 'completed' && file.url && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }}
                            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const a = document.createElement('a');
                              a.href = file.url!;
                              a.download = file.name;
                              a.click();
                            }}
                            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">{selectedFile.name}</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* File Preview */}
              <div className="mb-6">
                {selectedFile.category === 'image' && selectedFile.url && (
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    className="max-w-full max-h-96 mx-auto rounded"
                  />
                )}
                {selectedFile.category === 'video' && selectedFile.url && (
                  <video
                    src={selectedFile.url}
                    controls
                    className="max-w-full max-h-96 mx-auto rounded"
                  />
                )}
                {selectedFile.category === 'audio' && selectedFile.url && (
                  <div className="flex items-center justify-center p-8">
                    <audio src={selectedFile.url} controls className="w-full max-w-md" />
                  </div>
                )}
                {selectedFile.category === 'document' && (
                  <div className="flex items-center justify-center p-8 text-gray-400">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4" />
                      <p>Document preview not available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* File Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="text-white font-medium mb-3">File Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Size:</dt>
                      <dd className="text-white">{formatFileSize(selectedFile.size)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Type:</dt>
                      <dd className="text-white">{selectedFile.type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Status:</dt>
                      <dd className={`capitalize ${getStatusColor(selectedFile.status)}`}>
                        {selectedFile.status}
                      </dd>
                    </div>
                    {selectedFile.uploadedAt && (
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Uploaded:</dt>
                        <dd className="text-white">{selectedFile.uploadedAt.toLocaleString()}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                {selectedFile.metadata && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Metadata</h4>
                    <dl className="space-y-2">
                      {selectedFile.metadata.duration && (
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Duration:</dt>
                          <dd className="text-white">{selectedFile.metadata.duration}</dd>
                        </div>
                      )}
                      {selectedFile.metadata.dimensions && (
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Dimensions:</dt>
                          <dd className="text-white">
                            {selectedFile.metadata.dimensions.width} × {selectedFile.metadata.dimensions.height}
                          </dd>
                        </div>
                      )}
                      {selectedFile.metadata.bitrate && (
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Bitrate:</dt>
                          <dd className="text-white">{selectedFile.metadata.bitrate}</dd>
                        </div>
                      )}
                      {selectedFile.metadata.codec && (
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Codec:</dt>
                          <dd className="text-white">{selectedFile.metadata.codec}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
                {selectedFile.status === 'completed' && selectedFile.url && (
                  <>
                    <button
                      onClick={() => window.open(selectedFile.url, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = selectedFile.url!;
                        a.download = selectedFile.name;
                        a.click();
                      }}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => removeFile(selectedFile.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};