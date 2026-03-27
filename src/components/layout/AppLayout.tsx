import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="lg:pl-60">
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6 lg:max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
