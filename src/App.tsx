import '@/styles/App.css'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { Camera, Upload, Images } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageServer } from '@/api/image-server'
import { useEffect } from 'react'


function NavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  const location = useLocation()
  const isActive = location.pathname === to
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function App() {
  // 初始化图片服务器
  useEffect(() => {
    ImageServer.initialize()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6" />
          <h1 className="text-xl font-semibold">图床上传</h1>
        </div>
        <nav className="flex items-center gap-4">
          <NavLink to="/upload" icon={Upload} label="上传" />
          <NavLink to="/gallery" icon={Images} label="图库" />
        </nav>
        <ModeToggle />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
