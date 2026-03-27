import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, Camera, Share2, LogOut } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'

const navItems = [
  { to: '/profil', icon: Home, labelKey: 'nav.profile' as const },
  { to: '/menu', icon: ClipboardList, labelKey: 'nav.menu' as const },
  { to: '/photos', icon: Camera, labelKey: 'nav.photos' as const },
  { to: '/export', icon: Share2, labelKey: 'nav.export' as const },
]

export function Sidebar() {
  const { t } = useI18n()
  const { signOut } = useAuth()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-[#FAF8F5] border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <span className="text-2xl font-bold font-serif text-[#C9A961]">Auguste</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#C9A961]/10 text-[#C9A961]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={20} strokeWidth={1.8} />
          {t('auth.logout')}
        </button>
      </div>
    </aside>
  )
}
