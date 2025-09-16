import React, { useCallback, useRef, useState } from 'react'
import { Upload, FileImage, Trash2, Copy, Eye, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useUpload } from '@/hooks/use-upload'

const UploadPage: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    files,
    uploadStatus,
    uploadResults,
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    restartUpload,
    formatFileSize,
    getSupportedTypes
  } = useUpload()

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    addFiles(selectedFiles)
  }, [addFiles])

  // 处理拖拽事件
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
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }, [handleFileSelect])

  // 点击选择文件
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // 复制链接
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('链接已复制到剪贴板')
    } catch (err) {
      toast.error('复制失败，请手动复制')
    }
  }

  // 预览图片
  const previewImage = (url: string) => {
    window.open(url, '_blank')
  }

  // 分享链接
  const shareLink = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '图片分享',
          url: url
        })
      } catch (err) {
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* 上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              图片上传
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadStatus === 'idle' && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
              >
                <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  拖拽文件到此处或点击选择
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  支持 {getSupportedTypes().map(type => type.split('/')[1].toUpperCase()).join(', ')} 格式，单个文件最大 10MB
                </p>
                <Button variant="outline">
                  选择文件
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={getSupportedTypes().join(',')}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>
            )}

            {/* 文件列表 */}
            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">待上传文件 ({files.length})</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFiles}
                    >
                      清空列表
                    </Button>
                    {uploadStatus === 'idle' && (
                      <Button
                        onClick={startUpload}
                        disabled={files.length === 0}
                      >
                        开始上传
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <FileImage className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <Badge variant={
                            file.status === 'success' ? 'default' :
                            file.status === 'uploading' ? 'secondary' :
                            file.status === 'error' ? 'destructive' : 'outline'
                          }>
                            {file.status === 'waiting' && '等待中'}
                            {file.status === 'uploading' && '上传中'}
                            {file.status === 'success' && '成功'}
                            {file.status === 'error' && '失败'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.type.split('/')[1].toUpperCase()}</span>
                        </div>

                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="mt-2" />
                        )}

                        {file.status === 'success' && file.url && (
                          <div className="mt-2">
                            <Input
                              value={file.url}
                              readOnly
                              className="text-xs"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {file.status === 'success' && file.url && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(file.url!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => previewImage(file.url!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => shareLink(file.url!)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {uploadStatus === 'idle' && (
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
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 上传结果 */}
        {uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>上传结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    成功上传 {uploadResults.length} 个文件
                  </p>
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          批量复制链接
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>批量复制链接</AlertDialogTitle>
                          <AlertDialogDescription>
                            将所有图片链接复制到剪贴板
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const links = uploadResults.map(result => result.url).join('\n')
                              copyToClipboard(links)
                            }}
                          >
                            复制
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3">
                  {uploadResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <FileImage className="h-6 w-6 text-green-600 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate mb-1">
                          {result.name}
                        </p>
                        <Input
                          value={result.url}
                          readOnly
                          className="text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewImage(result.url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareLink(result.url)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-center">
                  <Button onClick={restartUpload}>
                    继续上传
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default UploadPage