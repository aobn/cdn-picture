// 图片服务 - 处理Base64图片的访问
import { DatabaseService } from './database'

export interface ImageData {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  url: string
  fileData: string
  uploadTime: string
  status: string
  albumId: string
  viewCount: number
  downloadCount: number
}

export class ImageService {
  // 根据ID获取图片数据
  static async getImageById(id: string): Promise<{
    data: string
    mimeType: string
    filename: string
  } | null> {
    try {
      const result = await DatabaseService.execute(`
        SELECT file_data, mime_type, filename, original_name
        FROM images 
        WHERE id = ? AND status = 'active'
      `, [id])

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      
      // 更新访问次数
      await this.incrementViewCount(id)
      
      return {
        data: row.file_data as string,
        mimeType: row.mime_type as string,
        filename: row.original_name as string
      }
    } catch (error) {
      console.error('获取图片失败:', error)
      return null
    }
  }

  // 创建图片的Data URL
  static createDataUrl(base64Data: string, mimeType: string): string {
    return `data:${mimeType};base64,${base64Data}`
  }

  // 更新图片访问次数
  static async incrementViewCount(id: string): Promise<void> {
    try {
      await DatabaseService.execute(`
        UPDATE images 
        SET view_count = view_count + 1 
        WHERE id = ? AND status = 'active'
      `, [id])
    } catch (error) {
      console.error('更新访问次数失败:', error)
    }
  }

  // 获取所有图片列表
  static async getAllImages(limit: number = 50, offset: number = 0): Promise<ImageData[]> {
    try {
      const result = await DatabaseService.execute(`
        SELECT 
          id, filename, original_name, file_size, mime_type, url, file_data,
          upload_time, status, album_id, view_count, download_count
        FROM images 
        WHERE status = 'active'
        ORDER BY upload_time DESC
        LIMIT ? OFFSET ?
      `, [limit, offset])

      return result.rows.map(row => ({
        id: row.id as string,
        filename: row.filename as string,
        originalName: row.original_name as string,
        fileSize: row.file_size as number,
        mimeType: row.mime_type as string,
        url: row.url as string,
        fileData: row.file_data as string,
        uploadTime: row.upload_time as string,
        status: row.status as string,
        albumId: row.album_id as string,
        viewCount: row.view_count as number,
        downloadCount: row.download_count as number
      }))
    } catch (error) {
      console.error('获取图片列表失败:', error)
      return []
    }
  }

  // 根据相册ID获取图片
  static async getImagesByAlbum(albumId: string, limit: number = 50, offset: number = 0): Promise<ImageData[]> {
    try {
      const result = await DatabaseService.execute(`
        SELECT 
          id, filename, original_name, file_size, mime_type, url, file_data,
          upload_time, status, album_id, view_count, download_count
        FROM images 
        WHERE status = 'active' AND album_id = ?
        ORDER BY upload_time DESC
        LIMIT ? OFFSET ?
      `, [albumId, limit, offset])

      return result.rows.map(row => ({
        id: row.id as string,
        filename: row.filename as string,
        originalName: row.original_name as string,
        fileSize: row.file_size as number,
        mimeType: row.mime_type as string,
        url: row.url as string,
        fileData: row.file_data as string,
        uploadTime: row.upload_time as string,
        status: row.status as string,
        albumId: row.album_id as string,
        viewCount: row.view_count as number,
        downloadCount: row.download_count as number
      }))
    } catch (error) {
      console.error('获取相册图片失败:', error)
      return []
    }
  }

  // 删除图片
  static async deleteImage(id: string): Promise<boolean> {
    try {
      await DatabaseService.execute(`
        UPDATE images 
        SET status = 'deleted' 
        WHERE id = ?
      `, [id])
      return true
    } catch (error) {
      console.error('删除图片失败:', error)
      return false
    }
  }

  // 获取图片统计信息
  static async getImageStats(): Promise<{
    totalImages: number
    totalSize: number
    todayUploads: number
  }> {
    try {
      const [totalResult, sizeResult, todayResult] = await Promise.all([
        DatabaseService.execute(`SELECT COUNT(*) as count FROM images WHERE status = 'active'`),
        DatabaseService.execute(`SELECT COALESCE(SUM(file_size), 0) as size FROM images WHERE status = 'active'`),
        DatabaseService.execute(`
          SELECT COUNT(*) as count FROM images 
          WHERE status = 'active' AND DATE(upload_time) = DATE('now')
        `)
      ])

      return {
        totalImages: (totalResult.rows[0]?.count as number) || 0,
        totalSize: (sizeResult.rows[0]?.size as number) || 0,
        todayUploads: (todayResult.rows[0]?.count as number) || 0
      }
    } catch (error) {
      console.error('获取图片统计失败:', error)
      return { totalImages: 0, totalSize: 0, todayUploads: 0 }
    }
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化上传时间
  static formatUploadTime(uploadTime: string): string {
    const date = new Date(uploadTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    
    return date.toLocaleDateString('zh-CN')
  }
}