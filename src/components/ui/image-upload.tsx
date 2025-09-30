/**
 * 图片上传组件
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { uploadImage, type UploadResult } from '@/api/upload';
import { Upload, X, Check, AlertCircle, Copy, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 上传状态枚举
 */
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/**
 * 上传的图片信息
 */
interface UploadedImage {
  id: string;
  file: File;
  url: string;
  status: UploadStatus;
  error?: string;
}

/**
 * 图片上传组件属性
 */
interface ImageUploadProps {
  maxFiles?: number;
  maxSize?: number; // 单位：MB
  acceptedTypes?: string[];
  onUploadComplete?: (images: UploadedImage[]) => void;
  className?: string;
}

/**
 * 图片上传组件
 */
export function ImageUpload({
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  onUploadComplete,
  className,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 验证文件
   */
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}`;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小超过限制: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${maxSize}MB`;
    }
    
    return null;
  };

  /**
   * 处理文件选择
   */
  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    const newImages: UploadedImage[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        alert(error);
        continue;
      }

      const imageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newImage: UploadedImage = {
        id: imageId,
        file,
        url: '',
        status: 'uploading',
      };
      
      newImages.push(newImage);
    }

    setImages(prev => [...prev, ...newImages]);

    // 开始上传
    for (const image of newImages) {
      try {
        setUploadProgress(0);
        const result: UploadResult = await uploadImage(image.file);
        
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { 
                ...img, 
                status: result.success ? 'success' : 'error',
                url: result.url || '',
                error: result.error 
              }
            : img
        ));
        
        setUploadProgress(100);
      } catch (error) {
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { 
                ...img, 
                status: 'error',
                error: error instanceof Error ? error.message : '上传失败'
              }
            : img
        ));
      }
    }

    // 通知父组件上传完成
    if (onUploadComplete) {
      const successImages = images.filter(img => img.status === 'success');
      onUploadComplete(successImages);
    }
  };

  /**
   * 处理拖拽事件
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  /**
   * 删除图片
   */
  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  /**
   * 复制链接到剪贴板
   */
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('链接已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  /**
   * 预览图片
   */
  const previewImage = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle>图片上传</CardTitle>
          <CardDescription>
            支持 {acceptedTypes.map(type => type.split('/')[1]).join(', ')} 格式，
            单个文件最大 {maxSize}MB，最多上传 {maxFiles} 个文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              拖拽图片到此处或点击选择文件
            </p>
            <p className="text-sm text-muted-foreground">
              支持多文件上传
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* 上传进度 */}
      {images.some(img => img.status === 'uploading') && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>上传进度</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图片列表 */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>上传的图片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {images.map((image) => (
                <div key={image.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  {/* 状态图标 */}
                  <div className="flex-shrink-0">
                    {image.status === 'uploading' && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    )}
                    {image.status === 'success' && (
                      <Check className="h-6 w-6 text-green-500" />
                    )}
                    {image.status === 'error' && (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>

                  {/* 文件信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(image.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {image.status === 'success' && image.url && (
                      <p className="text-xs text-green-600 truncate">{image.url}</p>
                    )}
                    {image.status === 'error' && image.error && (
                      <p className="text-xs text-red-600">{image.error}</p>
                    )}
                  </div>

                  {/* 状态标签 */}
                  <div className="flex-shrink-0">
                    <Badge variant={
                      image.status === 'success' ? 'default' :
                      image.status === 'error' ? 'destructive' :
                      'secondary'
                    }>
                      {image.status === 'uploading' && '上传中'}
                      {image.status === 'success' && '成功'}
                      {image.status === 'error' && '失败'}
                    </Badge>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex-shrink-0 flex space-x-2">
                    {image.status === 'success' && image.url && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(image.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewImage(image.url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 成功提示 */}
      {images.some(img => img.status === 'success') && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            已成功上传 {images.filter(img => img.status === 'success').length} 个文件
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}