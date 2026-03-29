import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Camera, Sparkles, FileDown, ChevronRight, Menu, X } from 'lucide-react'

// ── Placeholder food images (elegant gradient cards) ─────────────────────────
const DEMO_DISHES = [
  { name: 'Tartare de saumon', gradient: 'from-rose-300 via-orange-200 to-amber-100' },
  { name: 'Risotto aux cèpes', gradient: 'from-amber-200 via-yellow-100 to-lime-100' },
  { name: 'Filet de bœuf', gradient: 'from-red-300 via-rose-200 to-pink-100' },
  { name: 'Tiramisu maison', gradient: 'from-amber-300 via-orange-200 to-yellow-100' },
  { name: 'Salade niçoise', gradient: 'from-emerald-200 via-teal-100 to-cyan-100' },
  { name: 'Crème brûlée', gradient: 'from-yellow-200 via-amber-100 to-orange-100' },
]

export function LandingPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#FAF8F5] overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F5]/80 backdrop-blur-lg border-b border-[#C9A961]/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <h1
            className="text-2xl font-bold font-serif text-[#C9A961] cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Auguste
          </h1>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#how" className="text-sm text-[#2C2622]/60 hover:text-[#C9A961] transition-colors">
              {t('landing.howItWorks')}
            </a>
            <a href="#gallery" className="text-sm text-[#2C2622]/60 hover:text-[#C9A961] transition-colors">
              {t('landing.gallery')}
            </a>
            <a href="#pricing" className="text-sm text-[#2C2622]/60 hover:text-[#C9A961] transition-colors">
              {t('landing.pricing')}
            </a>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-[#2C2622]/70 hover:text-[#C9A961] transition-colors font-medium"
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => navigate('/login?signup=1')}
              className="px-5 py-2.5 bg-[#C9A961] text-white text-sm font-semibold rounded-full hover:bg-[#b8963a] active:scale-[0.97] transition-all"
            >
              {t('landing.startFree')}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#2C2622]/70"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF8F5] border-t border-[#C9A961]/10 px-5 py-6 space-y-4 animate-fade-in">
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#2C2622]/70">
              {t('landing.howItWorks')}
            </a>
            <a href="#gallery" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#2C2622]/70">
              {t('landing.gallery')}
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#2C2622]/70">
              {t('landing.pricing')}
            </a>
            <hr className="border-[#C9A961]/10" />
            <button
              onClick={() => navigate('/login')}
              className="block text-sm text-[#2C2622]/70 font-medium"
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => navigate('/login?signup=1')}
              className="w-full py-3 bg-[#C9A961] text-white text-sm font-semibold rounded-full"
            >
              {t('landing.startFree')}
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 lg:pt-40 lg:pb-28 px-5">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left — text */}
          <div className="text-center lg:text-left landing-stagger">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold mb-6 landing-stagger-1">
              <Sparkles size={14} />
              {t('landing.badge')}
            </div>

            <h2 className="text-4xl lg:text-6xl font-bold font-serif text-[#2C2622] leading-tight mb-6 landing-stagger-2">
              {t('landing.heroTitle1')}
              <span className="text-[#C9A961]"> {t('landing.heroTitleGold')}</span>
              {t('landing.heroTitle2')}
            </h2>

            <p className="text-base lg:text-lg text-[#2C2622]/60 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed landing-stagger-3">
              {t('landing.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start landing-stagger-4">
              <button
                onClick={() => navigate('/login?signup=1')}
                className="px-8 py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm hover:bg-[#b8963a] active:scale-[0.97] transition-all shadow-lg shadow-[#C9A961]/20"
              >
                {t('landing.ctaPrimary')}
              </button>
              <a
                href="#how"
                className="px-8 py-4 border border-[#2C2622]/15 text-[#2C2622]/70 font-medium rounded-full text-sm hover:border-[#C9A961]/40 hover:text-[#C9A961] transition-all text-center"
              >
                {t('landing.ctaSecondary')}
              </a>
            </div>

            <p className="text-xs text-[#2C2622]/40 mt-4 landing-stagger-5">
              {t('landing.noCard')}
            </p>
          </div>

          {/* Right — visual: tilted photo cards */}
          <div className="mt-14 lg:mt-0 relative h-80 lg:h-[420px] landing-stagger-5">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Decorative glow */}
              <div className="absolute w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-[#C9A961]/8 blur-3xl" />

              {/* Card stack */}
              <div className="relative w-56 h-72 lg:w-64 lg:h-80">
                {/* Back card */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-300 via-orange-200 to-amber-100 shadow-xl rotate-6 scale-95 opacity-60" />
                {/* Middle card */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-100 to-lime-100 shadow-xl -rotate-3 scale-[0.98] opacity-80" />
                {/* Front card */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-200 via-teal-100 to-cyan-50 shadow-2xl flex flex-col justify-end p-5">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-xs font-semibold text-[#2C2622]">Tartare de saumon</p>
                    <p className="text-[10px] text-[#2C2622]/50 mt-0.5">14.50 &euro;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ───────────────────────────────────────────────── */}
      <section className="py-8 border-y border-[#C9A961]/10 bg-white/40">
        <div className="max-w-4xl mx-auto px-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center">
          <div>
            <p className="text-2xl font-bold font-serif text-[#C9A961]">3 min</p>
            <p className="text-xs text-[#2C2622]/50">{t('landing.stat1')}</p>
          </div>
          <div className="w-px h-8 bg-[#C9A961]/15 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold font-serif text-[#C9A961]">38</p>
            <p className="text-xs text-[#2C2622]/50">{t('landing.stat2')}</p>
          </div>
          <div className="w-px h-8 bg-[#C9A961]/15 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold font-serif text-[#C9A961]">IA</p>
            <p className="text-xs text-[#2C2622]/50">{t('landing.stat3')}</p>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how" className="py-20 lg:py-28 px-5 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.howLabel')}
            </p>
            <h3 className="text-3xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.howTitle')}
            </h3>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="group relative bg-white rounded-2xl p-7 border border-[#C9A961]/10 hover:border-[#C9A961]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center mb-5">
                <Camera size={22} className="text-[#C9A961]" />
              </div>
              <div className="absolute top-7 right-7 text-5xl font-bold font-serif text-[#C9A961]/8">1</div>
              <h4 className="text-lg font-semibold text-[#2C2622] mb-2">{t('landing.step1Title')}</h4>
              <p className="text-sm text-[#2C2622]/55 leading-relaxed">{t('landing.step1Desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="group relative bg-white rounded-2xl p-7 border border-[#C9A961]/10 hover:border-[#C9A961]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center mb-5">
                <Sparkles size={22} className="text-[#C9A961]" />
              </div>
              <div className="absolute top-7 right-7 text-5xl font-bold font-serif text-[#C9A961]/8">2</div>
              <h4 className="text-lg font-semibold text-[#2C2622] mb-2">{t('landing.step2Title')}</h4>
              <p className="text-sm text-[#2C2622]/55 leading-relaxed">{t('landing.step2Desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="group relative bg-white rounded-2xl p-7 border border-[#C9A961]/10 hover:border-[#C9A961]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center mb-5">
                <FileDown size={22} className="text-[#C9A961]" />
              </div>
              <div className="absolute top-7 right-7 text-5xl font-bold font-serif text-[#C9A961]/8">3</div>
              <h4 className="text-lg font-semibold text-[#2C2622] mb-2">{t('landing.step3Title')}</h4>
              <p className="text-sm text-[#2C2622]/55 leading-relaxed">{t('landing.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery preview ────────────────────────────────────────────────── */}
      <section id="gallery" className="py-20 lg:py-28 bg-[#2C2622] px-5 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.galleryLabel')}
            </p>
            <h3 className="text-3xl lg:text-4xl font-bold font-serif text-white">
              {t('landing.galleryTitle')}
            </h3>
            <p className="text-sm text-white/40 mt-3 max-w-md mx-auto">
              {t('landing.gallerySubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {DEMO_DISHES.map((dish, i) => (
              <div
                key={i}
                className="group aspect-square rounded-2xl overflow-hidden relative cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dish.gradient} transition-transform duration-500 group-hover:scale-110`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs font-medium">{dish.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 lg:py-28 px-5 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.pricingLabel')}
            </p>
            <h3 className="text-3xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.pricingTitle')}
            </h3>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-7 border border-[#C9A961]/10">
              <p className="text-xs font-semibold text-[#C9A961] uppercase tracking-wider mb-1">{t('landing.planStarterName')}</p>
              <p className="text-3xl font-bold font-serif text-[#2C2622] mb-1">
                9<span className="text-base font-sans font-normal text-[#2C2622]/40"> &euro;</span>
              </p>
              <p className="text-xs text-[#2C2622]/45 mb-6">{t('landing.planStarterSub')}</p>
              <ul className="space-y-3 mb-7">
                <li className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planStarterF1')}
                </li>
                <li className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planStarterF2')}
                </li>
                <li className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planStarterF3')}
                </li>
              </ul>
              <button
                onClick={() => navigate('/login?signup=1')}
                className="w-full py-3.5 border border-[#C9A961]/30 text-[#C9A961] font-semibold rounded-full text-sm hover:bg-[#C9A961]/5 transition-colors"
              >
                {t('landing.choosePlan')}
              </button>
            </div>

            {/* Pro — highlighted */}
            <div className="bg-[#2C2622] rounded-2xl p-7 text-white relative ring-2 ring-[#C9A961]/40">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C9A961] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                {t('landing.popular')}
              </div>
              <p className="text-xs font-semibold text-[#C9A961] uppercase tracking-wider mb-1">{t('landing.planProName')}</p>
              <p className="text-3xl font-bold font-serif mb-1">
                29<span className="text-base font-sans font-normal text-white/40"> &euro;</span>
              </p>
              <p className="text-xs text-white/40 mb-6">{t('landing.planProSub')}</p>
              <ul className="space-y-3 mb-7">
                <li className="flex items-start gap-2 text-sm text-white/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planProF1')}
                </li>
                <li className="flex items-start gap-2 text-sm text-white/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planProF2')}
                </li>
                <li className="flex items-start gap-2 text-sm text-white/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planProF3')}
                </li>
              </ul>
              <button
                onClick={() => navigate('/login?signup=1')}
                className="w-full py-3.5 bg-[#C9A961] text-white font-semibold rounded-full text-sm hover:bg-[#b8963a] active:scale-[0.97] transition-all"
              >
                {t('landing.choosePlan')}
              </button>
            </div>

            {/* Resto */}
            <div className="bg-white rounded-2xl p-7 border border-[#C9A961]/10">
              <p className="text-xs font-semibold text-[#C9A961] uppercase tracking-wider mb-1">{t('landing.planRestoName')}</p>
              <p className="text-3xl font-bold font-serif text-[#2C2622] mb-1">
                59<span className="text-base font-sans font-normal text-[#2C2622]/40"> &euro;</span>
              </p>
              <p className="text-xs text-[#2C2622]/45 mb-6">{t('landing.planRestoSub')}</p>
              <ul className="space-y-3 mb-7">
                <li className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planRestoF1')}
                </li>
                <li className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planRestoF2')}
                </li>
                <li className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                  <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                  {t('landing.planRestoF3')}
                </li>
              </ul>
              <button
                onClick={() => navigate('/login?signup=1')}
                className="w-full py-3.5 border border-[#C9A961]/30 text-[#C9A961] font-semibold rounded-full text-sm hover:bg-[#C9A961]/5 transition-colors"
              >
                {t('landing.choosePlan')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-b from-[#FAF8F5] to-[#f3efe8]">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl lg:text-4xl font-bold font-serif text-[#2C2622] mb-4">
            {t('landing.ctaTitle')}
          </h3>
          <p className="text-sm text-[#2C2622]/50 mb-8 max-w-md mx-auto">
            {t('landing.ctaSubtitle')}
          </p>
          <button
            onClick={() => navigate('/login?signup=1')}
            className="px-10 py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm hover:bg-[#b8963a] active:scale-[0.97] transition-all shadow-lg shadow-[#C9A961]/20"
          >
            {t('landing.ctaPrimary')}
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-5 border-t border-[#C9A961]/10">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-sm font-serif font-bold text-[#C9A961]">Auguste</p>
          <p className="text-xs text-[#2C2622]/35">
            &copy; {new Date().getFullYear()} Auguste. {t('landing.footerRights')}
          </p>
        </div>
      </footer>
    </div>
  )
}
