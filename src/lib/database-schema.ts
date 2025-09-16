// 数据库表结构定义和初始化

import { DatabaseService } from './database'

// 数据库表结构
export const DATABASE_SCHEMA = {
  // 图片表
  images: `
    CREATE TABLE IF NOT EXISTS images (
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
      user_id TEXT,
      album_id TEXT DEFAULT 'default',
      tags TEXT,
      description TEXT,
      view_count INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0
    )
  `,

  // 相册表
  albums: `
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cover_image_id TEXT,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      user_id TEXT,
      is_public BOOLEAN DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    )
  `,

  // 用户表
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      avatar_url TEXT,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      storage_used INTEGER DEFAULT 0,
      storage_limit INTEGER DEFAULT 1073741824
    )
  `,

  // 上传日志表
  upload_logs: `
    CREATE TABLE IF NOT EXISTS upload_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_id TEXT,
      user_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_size INTEGER,
      status TEXT,
      error_message TEXT
    )
  `,

  // 系统配置表
  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
}

// 索引定义 - 暂时简化，只保留基本索引
export const DATABASE_INDEXES = [
  // 图片表基本索引
  'CREATE INDEX IF NOT EXISTS idx_images_upload_time ON images(upload_time DESC)',
  'CREATE INDEX IF NOT EXISTS idx_images_status ON images(status)'
]

// 初始数据
export const INITIAL_DATA = [
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
    args: ['storage_path', '/uploads', '存储路径']
  },
  {
    sql: `INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)`,
    args: ['cdn_domain', '', 'CDN域名']
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
export class DatabaseSchemaService {
  // 初始化所有表
  static async initializeDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('开始初始化数据库...')
      
      // 创建表
      for (const [tableName, sql] of Object.entries(DATABASE_SCHEMA)) {
        console.log(`创建表: ${tableName}`)
        await DatabaseService.execute(sql)
      }
      
      // 创建索引
      console.log('创建索引...')
      for (const indexSql of DATABASE_INDEXES) {
        await DatabaseService.execute(indexSql)
      }
      
      // 插入初始数据
      console.log('插入初始数据...')
      for (const data of INITIAL_DATA) {
        await DatabaseService.execute(data.sql, data.args)
      }
      
      console.log('数据库初始化完成')
      return { success: true }
      
    } catch (error) {
      console.error('数据库初始化失败:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }
  
  // 检查表是否存在
  static async checkTables(): Promise<string[]> {
    try {
      const result = await DatabaseService.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `)
      
      return result.rows.map(row => row.name as string)
    } catch (error) {
      console.error('检查表失败:', error)
      return []
    }
  }
  
  // 获取表结构信息
  static async getTableInfo(tableName: string) {
    try {
      const result = await DatabaseService.execute(`PRAGMA table_info(${tableName})`)
      return result.rows
    } catch (error) {
      console.error(`获取表 ${tableName} 信息失败:`, error)
      return []
    }
  }
  
  // 获取数据库统计信息
  static async getDatabaseStats() {
    try {
      const tables = await this.checkTables()
      const stats: Record<string, number> = {}
      
      for (const table of tables) {
        const result = await DatabaseService.execute(`SELECT COUNT(*) as count FROM ${table}`)
        stats[table] = (result.rows[0]?.count as number) || 0
      }
      
      return stats
    } catch (error) {
      console.error('获取数据库统计失败:', error)
      return {}
    }
  }
}