import React, { useState, useEffect } from 'react'
import { Eye, Copy, Download, Trash2, Search, Grid, List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ImageService, type ImageData } from '@/lib/image-service'
import { ImageServer } from '@/api/image-server'
import { toast } from 'sonner'

const GalleryPage: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 加载图片列表
  const loadImages = async () => {
    setLoading(true)
    try {
      const imageList = await ImageService.getAllImages(50, 0)
      setImages(imageList)
    } catch (error) {
      console.error('加载图片列表失败:', error)
      toast.error('加载图片列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载图片
  useEffect(() => {
    loadImages()
  }, [])

  // 过滤图片
  const filteredImages = images.filter(image =>
    image.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    return ImageService.formatFileSize(bytes)
  }

  // 格式化时间
  const formatTime = (timeStr: string): string => {
    return ImageService.formatUploadTime(timeStr)
  }

  // 复制链接
  const copyToClipboard = async (image: ImageData) => {
    try {
      // 从文件名中提取扩展名
      const extension = image.filename.split('.').pop() || 'jpg'
      const httpUrl = ImageServer.getImageUrl(image.id, extension)
      
      await navigator.clipboard.writeText(httpUrl)
      toast.success('外链已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      toast.error('复制失败，请手动复制')
    }
  }

  // 预览图片
  const previewImage = async (image: ImageData) => {
    try {
      // 创建Base64数据URL
      const dataUrl = ImageService.createDataUrl(image.fileData, image.mimeType)
      
      // 在新窗口中打开图片
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${image.originalName}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
              <img src="${dataUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" alt="${image.originalName}">
            </body>
          </html>
        `)
      }
      
      // 更新查看次数
      await ImageService.incrementViewCount(image.id)
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { ...img, viewCount: img.viewCount + 1 }
          : img
      ))
    } catch (error) {
      console.error('预览图片失败:', error)
      toast.error('预览失败')
    }
  }

  // 下载图片
  const downloadImage = async (image: ImageData) => {
    try {
      // 创建Base64数据URL
      const dataUrl = ImageService.createDataUrl(image.fileData, image.mimeType)
      
      // 创建下载链接
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = image.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`开始下载 ${image.originalName}`)
    } catch (error) {
      console.error('下载图片失败:', error)
      toast.error('下载失败')
    }
  }

  // 删除图片
  const deleteImage = async (image: ImageData) => {
    try {
      const success = await ImageService.deleteImage(image.id)
      if (success) {
        setImages(prev => prev.filter(img => img.id !== image.id))
        toast.success('图片已删除')
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      console.error('删除图片失败:', error)
      toast.error('删除失败')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>图片管理</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadImages}
                >
                  刷新
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索图片名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                共 {filteredImages.length} 张图片
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 图片列表 */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">加载中...</div>
            </CardContent>
          </Card>
        ) : filteredImages.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-muted-foreground mb-2">
                  {searchTerm ? '没有找到匹配的图片' : '还没有上传任何图片'}
                </div>
                {!searchTerm && (
                  <Button variant="outline" onClick={() => window.location.href = '/'}>
                    去上传图片
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredImages.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                {viewMode === 'grid' ? (
                  // 网格视图
                  <>
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={ImageService.createDataUrl(image.fileData, image.mimeType)}
                        alt={image.originalName}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => previewImage(image)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDJINmEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY3WiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xNCAydjRhMiAyIDAgMCAwIDIgMmg0IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+'
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium truncate" title={image.originalName}>
                          {image.originalName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(image.fileSize)}</span>
                          <span>•</span>
                          <span>{image.mimeType.split('/')[1].toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{image.viewCount}</span>
                          <Download className="h-3 w-3 ml-2" />
                          <span>{image.downloadCount}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(image)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewImage(image)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadImage(image)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除图片 "{image.originalName}" 吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteImage(image)}>
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  // 列表视图
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                        <img
                          src={ImageService.createDataUrl(image.fileData, image.mimeType)}
                          alt={image.originalName}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => previewImage(image)}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate mb-1">
                          {image.originalName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{formatFileSize(image.fileSize)}</span>
                          <span>{image.mimeType.split('/')[1].toUpperCase()}</span>
                          <span>{formatTime(image.uploadTime)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{image.viewCount} 次查看</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            <span>{image.downloadCount} 次下载</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(image)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewImage(image)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadImage(image)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除图片 "{image.originalName}" 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteImage(image)}>
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GalleryPage