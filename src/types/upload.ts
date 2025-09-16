// 上传相关类型定义

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'waiting' | 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  error?: string
}

export interface UploadResult {
  id: string
  name: string
  url: string
  size: number
  type: string
}

export type UploadStatus = 'idle' | 'uploading' | 'completed' | 'error'