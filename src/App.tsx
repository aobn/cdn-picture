import '@/styles/App.css'
import { Outlet } from 'react-router-dom'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { Camera } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6" />
          <h1 className="text-xl font-semibold">图床上传</h1>
        </div>
        <ModeToggle />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
