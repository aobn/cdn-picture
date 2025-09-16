// 数据库初始化 - 重新创建所有表

import { DatabaseService } from './database'

// 数据库表创建SQL
const CREATE_TABLES = [
  // 1. 图片表 - 核心表
  `CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER,
    height INTEGER,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    album_id TEXT DEFAULT 'default',
    tags TEXT,
    description TEXT,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0
  )`,

  // 2. 相册表
  `CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_id TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    is_public BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  )`,

  // 3. 上传日志表
  `CREATE TABLE IF NOT EXISTS upload_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    status TEXT,
    error_message TEXT
  )`,

  // 4. 系统配置表
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
]

// 基础索引
const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_images_upload_time ON images(upload_time DESC)',
  'CREATE INDEX IF NOT EXISTS idx_images_status ON images(status)',
  'CREATE INDEX IF NOT EXISTS idx_albums_status ON albums(status)',
  'CREATE INDEX IF NOT EXISTS idx_upload_logs_upload_time ON upload_logs(upload_time DESC)'
]

// 初始数据
const INSERT_INITIAL_DATA = [
  // 默认相册
  {
    sql: `INSERT OR IGNORE INTO albums (id, name, description, is_public) VALUES (?, ?, ?, ?)`,
    args: ['default', '默认相册', '系统默认相册', 1]
  },
  
  // 系统配置
  {
    sql: `INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)`,
    args: ['max_file_size', '10485760', '最大文件大小(10MB)']
  },
  {
    sql: `INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)`,
    args: ['allowed_types', 'image/jpeg,image/png,image/gif,image/webp', '允许的文件类型']
  },
  {
    sql: `INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)`,
    args: ['site_title', '图床系统', '站点标题']
  },
  {
    sql: `INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)`,
    args: ['site_description', '简单易用的图片存储服务', '站点描述']
  }
]

// 数据库初始化服务
export class DatabaseInitService {
  // 完整初始化数据库
  static async initializeDatabase(): Promise<{ success: boolean; error?: string; tables?: string[] }> {
    try {
      console.log('🚀 开始重新初始化数据库...')
      
      // 1. 创建所有表
      console.log('📋 创建数据库表...')
      for (let i = 0; i < CREATE_TABLES.length; i++) {
        const sql = CREATE_TABLES[i]
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || `table_${i + 1}`
        console.log(`  ✓ 创建表: ${tableName}`)
        await DatabaseService.execute(sql)
      }
      
      // 2. 创建索引
      console.log('🔍 创建索引...')
      for (const indexSql of CREATE_INDEXES) {
        await DatabaseService.execute(indexSql)
      }
      
      // 3. 插入初始数据
      console.log('📝 插入初始数据...')
      for (const data of INSERT_INITIAL_DATA) {
        await DatabaseService.execute(data.sql, data.args)
      }
      
      // 4. 验证表创建
      const tables = await this.getTables()
      console.log('✅ 数据库初始化完成，创建的表:', tables)
      
      return { 
        success: true, 
        tables 
      }
      
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }
  
  // 获取所有表
  static async getTables(): Promise<string[]> {
    try {
      const result = await DatabaseService.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `)
      
      return result.rows.map(row => row.name as string)
    } catch (error) {
      console.error('获取表列表失败:', error)
      return []
    }
  }
  
  // 获取表统计信息
  static async getTableStats(): Promise<Record<string, number>> {
    try {
      const tables = await this.getTables()
      const stats: Record<string, number> = {}
      
      for (const table of tables) {
        try {
          const result = await DatabaseService.execute(`SELECT COUNT(*) as count FROM ${table}`)
          stats[table] = (result.rows[0]?.count as number) || 0
        } catch (error) {
          console.warn(`获取表 ${table} 统计失败:`, error)
          stats[table] = 0
        }
      }
      
      return stats
    } catch (error) {
      console.error('获取表统计失败:', error)
      return {}
    }
  }
  
  // 获取图片统计信息
  static async getImageStats(): Promise<{
    totalImages: number
    totalSize: number
    todayUploads: number
  }> {
    try {
      // 检查images表是否存在
      const tables = await this.getTables()
      if (!tables.includes('images')) {
        return { totalImages: 0, totalSize: 0, todayUploads: 0 }
      }
      
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
  
  // 测试数据库连接
  static async testConnection(): Promise<boolean> {
    try {
      await DatabaseService.execute('SELECT 1')
      return true
    } catch (error) {
      console.error('数据库连接测试失败:', error)
      return false
    }
  }
}