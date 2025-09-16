// 数据库重新初始化组件
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DatabaseService } from '@/lib/database'
import { DatabaseInitService } from '@/lib/database-init'
import { toast } from 'sonner'
import { RefreshCw, Trash2 } from 'lucide-react'

export function DatabaseReinitComponent() {
  const [loading, setLoading] = useState(false)

  const dropAllTables = async () => {
    try {
      setLoading(true)
      
      // 获取所有表
      const tables = await DatabaseInitService.getTables()
      
      // 删除所有表
      for (const table of tables) {
        await DatabaseService.execute(`DROP TABLE IF EXISTS ${table}`)
        console.log(`✓ 删除表: ${table}`)
      }
      
      toast.success('所有表已删除')
    } catch (error) {
      console.error('删除表失败:', error)
      toast.error('删除表失败')
    } finally {
      setLoading(false)
    }
  }

  const reinitDatabase = async () => {
    try {
      setLoading(true)
      
      // 先删除所有表
      await dropAllTables()
      
      // 重新初始化数据库
      const result = await DatabaseInitService.initializeDatabase()
      
      if (result.success) {
        toast.success(`数据库重新初始化成功！创建了 ${result.tables?.length} 个表`)
      } else {
        toast.error(`数据库初始化失败: ${result.error}`)
      }
    } catch (error) {
      console.error('重新初始化失败:', error)
      toast.error('重新初始化失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据库管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          由于添加了Base64存储功能，需要重新初始化数据库表结构。
        </div>
        
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除所有表
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  这将删除数据库中的所有表和数据，此操作不可撤销。确定要继续吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={dropAllTables}>
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新初始化数据库
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>重新初始化数据库</AlertDialogTitle>
                <AlertDialogDescription>
                  这将删除所有现有数据并重新创建表结构，包含新的Base64存储字段。确定要继续吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={reinitDatabase}>
                  确认重新初始化
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}