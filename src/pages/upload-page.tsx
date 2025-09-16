import React, { useState, useCallback, useRef } from 'react'
import { Upload, FileImage, Trash2, Copy, Eye, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { UploadFile, UploadResult, UploadStatus } from '@/types/upload'

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 支持的文件类型
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  // 验证文件
  const validateFile = (file: File): string | null => {
    if (!supportedTypes.includes(file.type)) {
      return '不支持的文件格式，请选择 JPG、PNG、GIF 或 WebP 格式'
    }
    if (file.size > maxFileSize) {
      return '文件大小超过 10MB 限制'
    }
    return null
  }

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadFile[] = []
    
    Array.from(selectedFiles).forEach(file => {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }

      const uploadFile: UploadFile = {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'waiting',
        progress: 0
      }
      newFiles.push(uploadFile)
    })

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // 点击选择文件
  const handleSelectClick = () => {
    fileInputRef.current?.click()
  }

  // 删除文件
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  // 清空列表
  const clearFiles = () => {
    setFiles([])
    setUploadResults([])
    setUploadStatus('idle')
  }

  // 模拟上传文件
  const uploadFile = async (uploadFile: UploadFile): Promise<UploadResult> => {
    return new Promise((resolve) => {
      // 模拟上传进度
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          // 更新文件状态
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success', progress: 100, url: `https://img.example.com/${uploadFile.id}.${uploadFile.type.split('/')[1]}` }
              : f
          ))

          // 返回上传结果
          resolve({
            id: uploadFile.id,
            name: uploadFile.name,
            url: `https://img.example.com/${uploadFile.id}.${uploadFile.type.split('/')[1]}`,
            size: uploadFile.size,
            type: uploadFile.type
          })
        } else {
          // 更新进度
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'uploading', progress }
              : f
          ))
        }
      }, 200)
    })
  }

  // 开始上传
  const startUpload = async () => {
    if (files.length === 0) {
      toast.error('请先选择要上传的文件')
      return
    }

    setUploadStatus('uploading')
    const results: UploadResult[] = []

    try {
      // 并发上传，最多3个
      const uploadPromises = files.map(file => uploadFile(file))
      const uploadResults = await Promise.all(uploadPromises)
      
      results.push(...uploadResults)
      setUploadResults(results)
      setUploadStatus('completed')
      toast.success(`成功上传 ${results.length} 个文件`)
    } catch (error) {
      setUploadStatus('error')
      toast.error('上传失败，请重试')
    }
  }

  // 复制链接
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('链接已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // 预览图片
  const previewImage = (url: string) => {
    window.open(url, '_blank')
  }

  // 分享图片
  const shareImage = async (url: string, name: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          url: url
        })
      } catch (error) {
        copyLink(url)
      }
    } else {
      copyLink(url)
    }
  }

  // 继续上传
  const continueUpload = () => {
    setFiles([])
    setUploadResults([])
    setUploadStatus('idle')
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* 上传区域 */}
      {uploadStatus !== 'completed' && (
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* 拖拽上传区 */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
                ${isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/25 bg-muted/50'
                }
                ${files.length > 0 ? 'mb-6' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">拖拽图片到此处上传</h3>
              <p className="text-muted-foreground mb-4">或点击选择文件</p>
              <p className="text-sm text-muted-foreground mb-6">
                支持 JPG, PNG, GIF, WebP 格式，单个文件最大 10MB
              </p>
              <Button onClick={handleSelectClick}>
                选择文件
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* 文件预览列表 */}
            {files.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    待上传文件 ({files.length})
                  </h4>
                </div>
                
                <div className="space-y-3 mb-6">
                  {files.map((file) => (
                    <Card key={file.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileImage className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            file.status === 'success' ? 'default' :
                            file.status === 'uploading' ? 'secondary' :
                            file.status === 'error' ? 'destructive' : 'outline'
                          }>
                            {file.status === 'waiting' && '等待中'}
                            {file.status === 'uploading' && '上传中'}
                            {file.status === 'success' && '完成'}
                            {file.status === 'error' && '失败'}
                          </Badge>
                          {file.status === 'waiting' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {file.status !== 'waiting' && (
                        <Progress value={file.progress} className="h-2" />
                      )}
                    </Card>
                  ))}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-4 justify-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={uploadStatus === 'uploading'}>
                        清空列表
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认清空</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要清空所有文件吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={clearFiles}>
                          确认清空
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button 
                    onClick={startUpload}
                    disabled={uploadStatus === 'uploading' || files.length === 0}
                  >
                    {uploadStatus === 'uploading' ? '上传中...' : '开始上传'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 上传结果 */}
      {uploadStatus === 'completed' && uploadResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              ✅ 上传完成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {uploadResults.map((result) => (
                <Card key={result.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileImage className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium mb-1">{result.name}</p>
                        <Input
                          value={result.url}
                          readOnly
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(result.url)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      复制链接
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewImage(result.url)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareImage(result.url, result.name)}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      分享
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button onClick={continueUpload}>
                继续上传
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UploadPage