import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, Camera, Share2, LogOut, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { CreditsSheet } from './CreditsSheet'

interface Credits {
  remaining: number
  totalGenerated: number
}

interface SidebarProps {
  credits: Credits | null
  creditsSheetOpen: boolean
  onOpenCredits: () => void
  onCloseCredits: () => void
  paymentSuccess: boolean
}

const navItems = [
  { to: '/profil', icon: Home, labelKey: 'nav.profile' as const },
  { to: '/menu', icon: ClipboardList, labelKey: 'nav.menu' as const },
  { to: '/photos', icon: Camera, labelKey: 'nav.photos' as const },
  { to: '/export', icon: Share2, labelKey: 'nav.export' as const },
]

export function Sidebar({ credits, creditsSheetOpen, onOpenCredits, onCloseCredits, paymentSuccess }: SidebarProps) {
  const { t } = useI18n()
  const { signOut } = useAuth()

  return (
    <>
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

        {/* Credits button */}
        <div className="px-3 py-2">
          <button
            onClick={onOpenCredits}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#C9A961] hover:bg-[#C9A961]/10 transition-colors"
          >
            <Sparkles size={20} strokeWidth={1.8} />
            <span className="flex-1 text-left">{t('profile.credits.unit')}</span>
            <span className="bg-[#C9A961] text-white text-xs font-bold min-w-[24px] h-5 px-1.5 rounded-full flex items-center justify-center">
              {credits?.remaining ?? '—'}
            </span>
          </button>
        </div>

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

      {/* Only render CreditsSheet on desktop (BottomNav handles mobile) */}
      <div className="hidden lg:block">
        <CreditsSheet
          open={creditsSheetOpen}
          onClose={onCloseCredits}
          remaining={credits?.remaining ?? null}
          totalGenerated={credits?.totalGenerated ?? null}
          paymentSuccess={paymentSuccess}
        />
      </div>
    </>
  )
}
