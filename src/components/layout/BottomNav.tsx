import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, Camera, Share2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const navItems = [
  { to: '/profil', icon: Home, labelKey: 'nav.profile' as const },
  { to: '/menu', icon: ClipboardList, labelKey: 'nav.menu' as const },
  { to: '/photos', icon: Camera, labelKey: 'nav.photos' as const },
  { to: '/export', icon: Share2, labelKey: 'nav.export' as const },
]

export function BottomNav() {
  const { t } = useI18n()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[64px] ${
                isActive
                  ? 'text-[#C9A961]'
                  : 'text-gray-400 active:text-gray-600'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span className="text-[11px] font-medium">{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
      {/* Safe area for iOS home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
