import { useState, useCallback } from 'react'
import { UploadService, FileValidator } from '@/lib/upload-service'
import { DatabaseService } from '@/lib/database'
import type { UploadFile, UploadResult, UploadStatus } from '@/types/upload'
import { toast } from 'sonner'

// 上传钩子
export const useUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])

  // 生成唯一ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9)
  }, [])

  // 添加文件
  const addFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    const newFiles: UploadFile[] = []

    fileArray.forEach(file => {
      const validation = FileValidator.validate(file)
      if (!validation.valid) {
        toast.error(validation.error)
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
  }, [generateId])

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

  // 更新文件状态
  const updateFileStatus = useCallback((id: string, status: UploadFile['status'], progress?: number, url?: string, error?: string) => {
    setFiles(prev => prev.map(file => 
      file.id === id 
        ? { ...file, status, progress: progress ?? file.progress, url, error }
        : file
    ))
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
      // 初始化数据库
      await DatabaseService.initTables()

      // 使用模拟上传进行测试
      const uploadPromises = files.map(file => 
        UploadService.mockUpload(file, (progress) => {
          updateFileStatus(file.id, 'uploading', progress)
        })
        .then(result => {
          updateFileStatus(file.id, 'success', 100, result.url)
          results.push(result)
          return result
        })
        .catch(error => {
          updateFileStatus(file.id, 'error', 0, undefined, error.message)
          throw error
        })
      )

      await Promise.allSettled(uploadPromises)
      
      setUploadResults(results)
      setUploadStatus('completed')
      
      if (results.length > 0) {
        toast.success(`成功上传 ${results.length} 个文件`)
      }
    } catch (error) {
      setUploadStatus('error')
      toast.error('上传过程中出现错误')
    }
  }, [files, updateFileStatus])

  // 重新开始上传
  const restartUpload = useCallback(() => {
    setFiles([])
    setUploadResults([])
    setUploadStatus('idle')
  }, [])

  return {
    files,
    uploadStatus,
    uploadResults,
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    restartUpload,
    // 工具函数
    formatFileSize: FileValidator.formatFileSize,
    getSupportedTypes: FileValidator.getSupportedTypes,
    getMaxFileSize: FileValidator.getMaxFileSize
  }
}