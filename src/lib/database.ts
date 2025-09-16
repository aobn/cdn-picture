import { createClient } from '@libsql/client'

// 数据库客户端配置
const client = createClient({
  url: import.meta.env.VITE_DATABASE_URL || '',
  authToken: import.meta.env.VITE_DATABASE_AUTH_TOKEN || ''
})

// 图片记录接口
export interface ImageRecord {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  url: string
  upload_time: string
  status: 'active' | 'deleted'
}

// 数据库操作类
export class DatabaseService {
  // 执行SQL语句
  static async execute(sql: string, args?: any[]) {
    try {
      if (args) {
        return await client.execute({ sql, args })
      } else {
        return await client.execute(sql)
      }
    } catch (error) {
      console.error('SQL执行失败:', error)
      throw error
    }
  }

  // 初始化数据库表
  static async initTables() {
    try {
      // 使用新的数据库初始化服务
      const { DatabaseInitService } = await import('./database-init')
      const result = await DatabaseInitService.initializeDatabase()
      
      if (result.success) {
        console.log('✅ 数据库表初始化成功')
        return result
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ 数据库表初始化失败:', error)
      throw error
    }
  }

  // 保存图片记录
  static async saveImage(imageData: Omit<ImageRecord, 'upload_time'>): Promise<boolean> {
    try {
      await client.execute({
        sql: `
          INSERT INTO images (id, filename, original_name, file_size, mime_type, url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          imageData.id,
          imageData.filename,
          imageData.original_name,
          imageData.file_size,
          imageData.mime_type,
          imageData.url,
          imageData.status
        ]
      })
      return true
    } catch (error) {
      console.error('保存图片记录失败:', error)
      return false
    }
  }

  // 获取图片列表
  static async getImages(limit: number = 50, offset: number = 0): Promise<ImageRecord[]> {
    try {
      const result = await client.execute({
        sql: `
          SELECT * FROM images 
          WHERE status = 'active' 
          ORDER BY upload_time DESC 
          LIMIT ? OFFSET ?
        `,
        args: [limit, offset]
      })
      
      return result.rows.map(row => ({
        id: row.id as string,
        filename: row.filename as string,
        original_name: row.original_name as string,
        file_size: row.file_size as number,
        mime_type: row.mime_type as string,
        url: row.url as string,
        upload_time: row.upload_time as string,
        status: row.status as 'active' | 'deleted'
      }))
    } catch (error) {
      console.error('获取图片列表失败:', error)
      return []
    }
  }

  // 删除图片记录
  static async deleteImage(id: string): Promise<boolean> {
    try {
      await client.execute({
        sql: `UPDATE images SET status = 'deleted' WHERE id = ?`,
        args: [id]
      })
      return true
    } catch (error) {
      console.error('删除图片记录失败:', error)
      return false
    }
  }

  // 获取统计信息
  static async getStats(): Promise<{
    totalImages: number
    totalSize: number
    todayUploads: number
  }> {
    try {
      const [totalResult, sizeResult, todayResult] = await Promise.all([
        client.execute(`SELECT COUNT(*) as count FROM images WHERE status = 'active'`),
        client.execute(`SELECT SUM(file_size) as size FROM images WHERE status = 'active'`),
        client.execute(`
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
      console.error('获取统计信息失败:', error)
      return {
        totalImages: 0,
        totalSize: 0,
        todayUploads: 0
      }
    }
  }
}

export default client