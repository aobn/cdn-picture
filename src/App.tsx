import '@/styles/App.css'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { Button } from '@/components/ui/button'
import { Home, Upload } from 'lucide-react'


function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <nav className="flex items-center space-x-4">
            <Link to="/">
              <Button 
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                首页
              </Button>
            </Link>
            <Link to="/upload">
              <Button 
                variant={location.pathname === '/upload' ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                图片上传
              </Button>
            </Link>
          </nav>
          <ModeToggle />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
