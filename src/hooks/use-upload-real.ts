import { useState, useCallback } from 'react'
import type { UploadFile, UploadResult, UploadStatus } from '@/types/upload'
import { DatabaseInitService } from '@/lib/database-init'
import { DatabaseService } from '@/lib/database'
import { ImageServer } from '@/api/image-server'
import { generateUUID } from '@/lib/uuid'
import { toast } from 'sonner'

// 真实上传钩子
export const useUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])

  // 支持的文件类型
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  // 生成唯一ID
  const generateId = useCallback(() => {
    return generateUUID()
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

  // 上传单个文件到数据库
  const uploadFileToDatabase = useCallback(async (uploadFile: UploadFile): Promise<UploadResult> => {
    // 使用UUID作为文件名
    const extension = uploadFile.name.split('.').pop()
    const filename = `${uploadFile.id}.${extension}`
    
    // 将文件转换为Base64
    const fileBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // 移除data:image/jpeg;base64,前缀，只保留Base64数据
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(uploadFile.file)
    })
    
    // 生成HTTP外链URL
    const fileUrl = ImageServer.getImageUrl(uploadFile.id, extension || 'jpg')
    
    // 保存到数据库（包含Base64数据）
    const imageData = {
      id: uploadFile.id,
      filename: filename,
      original_name: uploadFile.name,
      file_size: uploadFile.size,
      mime_type: uploadFile.type,
      url: fileUrl,
      file_data: fileBase64, // 新增：Base64文件数据
      thumbnail_url: null,
      width: null,
      height: null,
      status: 'active' as const,
      album_id: 'default',
      tags: null,
      description: null,
      view_count: 0,
      download_count: 0
    }

    // 插入数据库
    await DatabaseService.execute(`
      INSERT INTO images (
        id, filename, original_name, file_size, mime_type, url, file_data,
        thumbnail_url, width, height, status, album_id, tags, 
        description, view_count, download_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      imageData.id,
      imageData.filename,
      imageData.original_name,
      imageData.file_size,
      imageData.mime_type,
      imageData.url,
      imageData.file_data,
      imageData.thumbnail_url,
      imageData.width,
      imageData.height,
      imageData.status,
      imageData.album_id,
      imageData.tags,
      imageData.description,
      imageData.view_count,
      imageData.download_count
    ])

    // 记录上传日志
    await DatabaseService.execute(`
      INSERT INTO upload_logs (
        image_id, ip_address, user_agent, file_size, status
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      uploadFile.id,
      'localhost', // 实际项目中获取真实IP
      navigator.userAgent,
      uploadFile.size,
      'success'
    ])

    return {
      id: uploadFile.id,
      name: uploadFile.name,
      url: fileUrl,
      size: uploadFile.size,
      type: uploadFile.type
    }
  }, [])

  // 模拟上传进度
  const simulateUploadProgress = useCallback((uploadFile: UploadFile): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 25 + 5 // 每次增加5-30%
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          // 更新文件状态为完成
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'uploading', progress: 100 }
              : f
          ))
          
          resolve()
        } else {
          // 更新进度
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'uploading', progress }
              : f
          ))
        }
      }, 150) // 每150ms更新一次
    })
  }, [])

  // 上传单个文件
  const uploadSingleFile = useCallback(async (uploadFile: UploadFile): Promise<UploadResult> => {
    try {
      // 模拟上传进度
      await simulateUploadProgress(uploadFile)
      
      // 保存到数据库
      const result = await uploadFileToDatabase(uploadFile)
      
      // 更新文件状态为成功
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100, url: result.url }
          : f
      ))
      
      return result
    } catch (error) {
      // 更新文件状态为失败
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', progress: 0, error: error instanceof Error ? error.message : '上传失败' }
          : f
      ))
      
      throw error
    }
  }, [simulateUploadProgress, uploadFileToDatabase])

  // 开始上传
  const startUpload = useCallback(async () => {
    if (files.length === 0) {
      toast.error('请先选择要上传的文件')
      return
    }

    setUploadStatus('uploading')
    const results: UploadResult[] = []

    try {
      // 确保数据库已初始化
      const connected = await DatabaseInitService.testConnection()
      if (!connected) {
        throw new Error('数据库连接失败')
      }

      // 串行上传文件（避免并发问题）
      for (const file of files) {
        try {
          const result = await uploadSingleFile(file)
          results.push(result)
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error)
          // 记录失败日志
          try {
            await DatabaseService.execute(`
              INSERT INTO upload_logs (
                image_id, ip_address, user_agent, file_size, status, error_message
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              file.id,
              'localhost',
              navigator.userAgent,
              file.size,
              'failed',
              error instanceof Error ? error.message : '未知错误'
            ])
          } catch (logError) {
            console.error('记录失败日志出错:', logError)
          }
        }
      }
      
      setUploadResults(results)
      setUploadStatus('completed')
      
      if (results.length > 0) {
        toast.success(`成功上传 ${results.length} 个文件`)
      } else {
        toast.error('所有文件上传失败')
      }
    } catch (error) {
      setUploadStatus('error')
      toast.error('上传过程中出现错误: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }, [files, uploadSingleFile])

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