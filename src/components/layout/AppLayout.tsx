import { useState, useEffect } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { useCredits } from '@/hooks/useCredits'

export function AppLayout() {
  const { credits, reload: reloadCredits } = useCredits()
  const [searchParams, setSearchParams] = useSearchParams()
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [creditsSheetOpen, setCreditsSheetOpen] = useState(false)

  // Listen for open-credits-sheet events from child pages (e.g. PhotosPage on 402)
  useEffect(() => {
    const handler = () => setCreditsSheetOpen(true)
    window.addEventListener('open-credits-sheet', handler)
    return () => window.removeEventListener('open-credits-sheet', handler)
  }, [])

  // Handle Stripe return
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      setPaymentSuccess(true)
      setCreditsSheetOpen(true)
      reloadCredits()
      searchParams.delete('payment')
      searchParams.delete('pack')
      setSearchParams(searchParams, { replace: true })
      setTimeout(() => setPaymentSuccess(false), 5000)
    } else if (payment === 'cancelled') {
      searchParams.delete('payment')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, reloadCredits])

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Desktop sidebar */}
      <Sidebar
        credits={credits}
        creditsSheetOpen={creditsSheetOpen}
        onOpenCredits={() => setCreditsSheetOpen(true)}
        onCloseCredits={() => setCreditsSheetOpen(false)}
        paymentSuccess={paymentSuccess}
      />

      {/* Main content */}
      <main className="lg:pl-60">
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6 lg:max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav
        credits={credits}
        creditsSheetOpen={creditsSheetOpen}
        onOpenCredits={() => setCreditsSheetOpen(true)}
        onCloseCredits={() => setCreditsSheetOpen(false)}
        paymentSuccess={paymentSuccess}
      />
    </div>
  )
}
