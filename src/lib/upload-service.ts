import { DatabaseService, type ImageRecord } from './database'
import type { UploadFile, UploadResult } from '@/types/upload'

// 上传服务类
export class UploadService {
  private static readonly UPLOAD_ENDPOINT = '/api/upload'
  
  // 生成唯一文件名
  private static generateFileName(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()
    return `${timestamp}_${random}.${extension}`
  }

  // 上传单个文件
  static async uploadFile(
    uploadFile: UploadFile,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      const fileName = this.generateFileName(uploadFile.name)
      
      formData.append('file', uploadFile.file, fileName)
      formData.append('originalName', uploadFile.name)
      
      const xhr = new XMLHttpRequest()
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress?.(progress)
        }
      })
      
      // 监听上传完成
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            
            // 保存到数据库
            const imageRecord: Omit<ImageRecord, 'upload_time'> = {
              id: uploadFile.id,
              filename: fileName,
              original_name: uploadFile.name,
              file_size: uploadFile.size,
              mime_type: uploadFile.type,
              url: response.url,
              status: 'active'
            }
            
            const saved = await DatabaseService.saveImage(imageRecord)
            if (!saved) {
              console.warn('数据库保存失败，但文件上传成功')
            }
            
            resolve({
              id: uploadFile.id,
              name: uploadFile.name,
              url: response.url,
              size: uploadFile.size,
              type: uploadFile.type
            })
          } catch (error) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error(`上传失败: ${xhr.status}`))
        }
      })
      
      // 监听上传错误
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'))
      })
      
      // 发送请求
      xhr.open('POST', this.UPLOAD_ENDPOINT)
      xhr.send(formData)
    })
  }

  // 批量上传文件
  static async uploadFiles(
    files: UploadFile[],
    onProgress?: (fileId: string, progress: number) => void,
    onComplete?: (result: UploadResult) => void,
    onError?: (fileId: string, error: string) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    const maxConcurrent = 3 // 最大并发数
    
    // 分批处理
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(file => 
        this.uploadFile(file, (progress) => {
          onProgress?.(file.id, progress)
        })
        .then(result => {
          onComplete?.(result)
          return result
        })
        .catch(error => {
          onError?.(file.id, error.message)
          throw error
        })
      )
      
      try {
        const batchResults = await Promise.allSettled(batchPromises)
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          }
        })
      } catch (error) {
        console.error('批量上传出错:', error)
      }
    }
    
    return results
  }

  // 模拟上传 (用于开发测试)
  static async mockUpload(
    uploadFile: UploadFile,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          const mockUrl = `https://cdn.example.com/${uploadFile.id}.${uploadFile.type.split('/')[1]}`
          
          // 模拟保存到数据库
          const imageRecord: Omit<ImageRecord, 'upload_time'> = {
            id: uploadFile.id,
            filename: this.generateFileName(uploadFile.name),
            original_name: uploadFile.name,
            file_size: uploadFile.size,
            mime_type: uploadFile.type,
            url: mockUrl,
            status: 'active'
          }
          
          DatabaseService.saveImage(imageRecord).catch(console.error)
          
          resolve({
            id: uploadFile.id,
            name: uploadFile.name,
            url: mockUrl,
            size: uploadFile.size,
            type: uploadFile.type
          })
        } else {
          onProgress?.(progress)
        }
      }, 200)
    })
  }
}

// 文件验证工具
export class FileValidator {
  private static readonly SUPPORTED_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ]
  
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  
  // 验证文件类型
  static validateType(file: File): boolean {
    return this.SUPPORTED_TYPES.includes(file.type)
  }
  
  // 验证文件大小
  static validateSize(file: File): boolean {
    return file.size <= this.MAX_FILE_SIZE
  }
  
  // 完整验证
  static validate(file: File): { valid: boolean; error?: string } {
    if (!this.validateType(file)) {
      return {
        valid: false,
        error: '不支持的文件格式，请选择 JPG、PNG、GIF 或 WebP 格式'
      }
    }
    
    if (!this.validateSize(file)) {
      return {
        valid: false,
        error: '文件大小超过 10MB 限制'
      }
    }
    
    return { valid: true }
  }
  
  // 获取支持的文件类型
  static getSupportedTypes(): string[] {
    return [...this.SUPPORTED_TYPES]
  }
  
  // 获取最大文件大小
  static getMaxFileSize(): number {
    return this.MAX_FILE_SIZE
  }
  
  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}