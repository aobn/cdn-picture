import React, { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatabaseService } from '@/lib/database'
import { DatabaseInitService } from '@/lib/database-init'

interface DatabaseStatus {
  connected: boolean
  error?: string
  stats?: {
    totalImages: number
    totalSize: number
    todayUploads: number
  }
  tables?: string[]
  tableStats?: Record<string, number>
}

const DatabaseStatusComponent: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus>({ connected: false })
  const [loading, setLoading] = useState(true)

  // 测试数据库连接
  const testConnection = async () => {
    setLoading(true)
    try {
      // 测试基础连接
      const connected = await DatabaseInitService.testConnection()
      if (!connected) {
        throw new Error('无法连接到数据库')
      }
      
      // 初始化数据库表
      const initResult = await DatabaseService.initTables()
      
      // 获取统计信息
      const stats = await DatabaseInitService.getImageStats()
      
      // 获取表列表
      const tables = await DatabaseInitService.getTables()
      
      // 获取表统计信息
      const tableStats = await DatabaseInitService.getTableStats()
      
      setStatus({
        connected: true,
        stats,
        tables,
        tableStats
      })
    } catch (error) {
      setStatus({
        connected: false,
        error: error instanceof Error ? error.message : '连接失败'
      })
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时测试连接
  useEffect(() => {
    testConnection()
  }, [])

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          数据库状态
          <div className="flex items-center gap-2 ml-auto">
            {loading ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                检测中
              </Badge>
            ) : status.connected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                已连接
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                连接失败
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">正在检测数据库连接...</span>
          </div>
        ) : status.connected ? (
          <div className="space-y-4">
            <div className="text-sm text-green-600">
              ✅ 数据库连接正常，表结构已初始化
            </div>
            
            {status.stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {status.stats.totalImages}
                  </div>
                  <div className="text-sm text-muted-foreground">总图片数</div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatFileSize(status.stats.totalSize)}
                  </div>
                  <div className="text-sm text-muted-foreground">总存储量</div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {status.stats.todayUploads}
                  </div>
                  <div className="text-sm text-muted-foreground">今日上传</div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                数据库地址: {import.meta.env.VITE_DATABASE_URL}
              </div>
              
              {status.tables && status.tables.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">数据库表结构:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {status.tables.map(table => (
                      <div key={table} className="text-xs p-2 bg-muted/30 rounded border">
                        <div className="font-medium">{table}</div>
                        {status.tableStats && (
                          <div className="text-muted-foreground">
                            {status.tableStats[table] || 0} 条记录
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-red-600">
              ❌ 数据库连接失败
            </div>
            
            {status.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm font-medium text-red-800 dark:text-red-200">
                  错误信息:
                </div>
                <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {status.error}
                </div>
              </div>
            )}
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>请检查以下配置:</div>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>数据库URL是否正确</li>
                <li>认证Token是否有效</li>
                <li>网络连接是否正常</li>
                <li>数据库服务是否可用</li>
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testConnection}
              disabled={loading}
            >
              重新测试连接
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DatabaseStatusComponent