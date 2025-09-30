/**
 * 图片上传页面
 */


import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Zap, Shield } from 'lucide-react';

/**
 * 图片上传页面组件
 */
export function ImageUploadPage() {
  /**
   * 处理上传完成
   */
  const handleUploadComplete = (images: any[]) => {
    console.log('上传完成的图片:', images);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Upload className="h-10 w-10 text-primary" />
          图片上传中心
        </h1>
        <p className="text-xl text-muted-foreground">
          快速、安全、可靠的图片上传服务
        </p>
      </div>

      {/* 功能特性 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="text-center">
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">快速上传</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              支持拖拽上传和批量上传，上传速度快，体验流畅
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">安全可靠</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              采用安全的上传协议，确保您的图片数据安全
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Image className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">多格式支持</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              支持 JPEG、PNG、GIF、WebP 等多种图片格式
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 上传规则说明 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>上传规则</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">支持的格式</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">JPEG</Badge>
                <Badge variant="secondary">PNG</Badge>
                <Badge variant="secondary">GIF</Badge>
                <Badge variant="secondary">WebP</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">上传限制</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 单个文件最大 10MB</li>
                <li>• 最多同时上传 10 个文件</li>
                <li>• 支持拖拽和点击上传</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图片上传组件 */}
      <ImageUpload
        maxFiles={10}
        maxSize={10}
        acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
        onUploadComplete={handleUploadComplete}
      />

      {/* 使用说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. 选择图片</h4>
              <p className="text-sm text-muted-foreground">
                您可以通过点击上传区域选择文件，或者直接将图片拖拽到上传区域
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. 自动上传</h4>
              <p className="text-sm text-muted-foreground">
                选择文件后会自动开始上传，您可以看到实时的上传进度
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. 获取链接</h4>
              <p className="text-sm text-muted-foreground">
                上传成功后，您可以复制图片链接或预览图片
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ImageUploadPage;