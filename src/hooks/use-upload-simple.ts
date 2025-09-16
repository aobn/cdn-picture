import { useState, useCallback } from 'react'
import type { UploadFile, UploadResult, UploadStatus } from '@/types/upload'
import { toast } from 'sonner'

// 简化版上传钩子
export const useUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])

  // 支持的文件类型
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  // 生成唯一ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9)
  }, [])

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    if (!supportedTypes.includes(file.type)) {
      return '不支持的文件格式，请选择 JPG、PNG、GIF 或 WebP 格式'
    }
    if (file.size > maxFileSize) {
      return '文件大小超过 10MB 限制'
    }
    return null
  }, [supportedTypes, maxFileSize])

  // 添加文件
  const addFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    const newFiles: UploadFile[] = []

    fileArray.forEach(file => {
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
    return newFiles
  }, [generateId, validateFile])

  // 移除文件
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }, [])

  // 清空文件列表
  const clearFiles = useCallback(() => {
    setFiles([])
    setUploadResults([])
    setUploadStatus('idle')
  }, [])

  // 模拟上传文件
  const uploadFile = useCallback(async (uploadFile: UploadFile): Promise<UploadResult> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          // 更新文件状态
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success', progress: 100, url: `https://cdn.example.com/${uploadFile.id}.${uploadFile.type.split('/')[1]}` }
              : f
          ))

          // 返回上传结果
          resolve({
            id: uploadFile.id,
            name: uploadFile.name,
            url: `https://cdn.example.com/${uploadFile.id}.${uploadFile.type.split('/')[1]}`,
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
  }, [])

  // 开始上传
  const startUpload = useCallback(async () => {
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
  }, [files, uploadFile])

  // 重新开始上传
  const restartUpload = useCallback(() => {
    setFiles([])
    setUploadResults([])
    setUploadStatus('idle')
  }, [])

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // 获取支持的文件类型
  const getSupportedTypes = useCallback(() => {
    return [...supportedTypes]
  }, [supportedTypes])

  // 获取最大文件大小
  const getMaxFileSize = useCallback(() => {
    return maxFileSize
  }, [maxFileSize])

  return {
    files,
    uploadStatus,
    uploadResults,
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    restartUpload,
    formatFileSize,
    getSupportedTypes,
    getMaxFileSize
  }
}