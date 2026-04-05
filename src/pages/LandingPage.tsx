import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import {
  Camera, Sparkles, FileDown, ChevronRight, Menu, X, ChevronDown,
  TrendingUp, Clock, Palette, Zap, Eye, CircleOff, Smartphone, Star, ArrowRight,
} from 'lucide-react'

// ── Data ────────────────────────────────────────────────────────────────────
const GALLERY_PHOTOS = [
  { name: 'Steak frites', category: 'Plats', url: 'https://cgsykmcohllfuwtessbp.supabase.co/storage/v1/object/public/menu-images/f2313099-8ad1-4d33-993e-63ac3bcad148/9a9db1e8-f030-4c3c-9c51-14ae6408e334_1775411834485.png' },
  { name: 'Les 6 hutres', category: 'Entrees', url: 'https://cgsykmcohllfuwtessbp.supabase.co/storage/v1/object/public/menu-images/f2313099-8ad1-4d33-993e-63ac3bcad148/743f3755-bdc1-40d1-8f43-8ff7f41fe69a_1775412963467.png' },
  { name: 'Oeufs mayonnaise', category: 'Entrees', url: 'https://cgsykmcohllfuwtessbp.supabase.co/storage/v1/object/public/menu-images/f2313099-8ad1-4d33-993e-63ac3bcad148/0ff9b790-6a42-45fe-8eac-6ef0ece5d354_1774880002797.webp' },
  { name: 'Rillettes de truite', category: 'Entrees', url: 'https://cgsykmcohllfuwtessbp.supabase.co/storage/v1/object/public/menu-images/f2313099-8ad1-4d33-993e-63ac3bcad148/040ec2f2-c1a3-477d-91a2-e482d5c24c84_1774899484853.webp' },
  { name: 'Ananas frais', category: 'Desserts', url: 'https://cgsykmcohllfuwtessbp.supabase.co/storage/v1/object/public/menu-images/f2313099-8ad1-4d33-993e-63ac3bcad148/e4ad7880-87f0-457f-a413-ac51fa9c603b_1775227216346.webp' },
  { name: 'Cantal entre-deux', category: 'Fromages', url: 'https://cgsykmcohllfuwtessbp.supabase.co/storage/v1/object/public/menu-images/f2313099-8ad1-4d33-993e-63ac3bcad148/3fd4bb52-4ccb-43a9-a06f-e341b184b623_1775227349589.webp' },
]

const TESTIMONIAL_METRICS = ['+25% de commandes', '800\u20AC economises', 'Qualite pro']

const PROBLEM_ITEMS = [
  { icon: Eye, title: 'landing.problem1Title', desc: 'landing.problem1Desc' },
  { icon: CircleOff, title: 'landing.problem2Title', desc: 'landing.problem2Desc' },
  { icon: Smartphone, title: 'landing.problem3Title', desc: 'landing.problem3Desc' },
] as const

const STEP_ITEMS = [
  { icon: Camera, num: '1', title: 'landing.step1Title', desc: 'landing.step1Desc' },
  { icon: Sparkles, num: '2', title: 'landing.step2Title', desc: 'landing.step2Desc' },
  { icon: FileDown, num: '3', title: 'landing.step3Title', desc: 'landing.step3Desc' },
] as const

const BENEFIT_ITEMS = [
  { icon: TrendingUp, title: 'landing.benefit1Title', desc: 'landing.benefit1Desc' },
  { icon: Clock, title: 'landing.benefit2Title', desc: 'landing.benefit2Desc' },
  { icon: Palette, title: 'landing.benefit3Title', desc: 'landing.benefit3Desc' },
  { icon: Zap, title: 'landing.benefit4Title', desc: 'landing.benefit4Desc' },
] as const

const TESTIMONIAL_ITEMS = [
  { quote: 'landing.testimonial1Quote', name: 'landing.testimonial1Name', role: 'landing.testimonial1Role' },
  { quote: 'landing.testimonial2Quote', name: 'landing.testimonial2Name', role: 'landing.testimonial2Role' },
  { quote: 'landing.testimonial3Quote', name: 'landing.testimonial3Name', role: 'landing.testimonial3Role' },
] as const

const FAQ_ITEMS = [
  { q: 'landing.faq1Q', a: 'landing.faq1A' },
  { q: 'landing.faq2Q', a: 'landing.faq2A' },
  { q: 'landing.faq3Q', a: 'landing.faq3A' },
  { q: 'landing.faq4Q', a: 'landing.faq4A' },
  { q: 'landing.faq5Q', a: 'landing.faq5A' },
] as const

const STAT_ITEMS = [
  { value: 'landing.stat1Value', label: 'landing.stat1Label' },
  { value: 'landing.stat2Value', label: 'landing.stat2Label' },
  { value: 'landing.stat3Value', label: 'landing.stat3Label' },
  { value: 'landing.stat4Value', label: 'landing.stat4Label' },
] as const

// ── Component ───────────────────────────────────────────────────────────────
export function LandingPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const goSignup = () => navigate('/login?signup=1')

  return (
    <div className="min-h-screen bg-[#FAF8F5] overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F5]/80 backdrop-blur-lg border-b border-[#C9A961]/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <h1
            className="text-2xl font-bold font-serif text-[#C9A961] cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Auguste
          </h1>

          <div className="hidden lg:flex items-center gap-8">
            <a href="#how" className="text-sm text-[#2C2622]/60 hover:text-[#C9A961] transition-colors">{t('landing.howItWorks')}</a>
            <a href="#gallery" className="text-sm text-[#2C2622]/60 hover:text-[#C9A961] transition-colors">{t('landing.gallery')}</a>
            <a href="#pricing" className="text-sm text-[#2C2622]/60 hover:text-[#C9A961] transition-colors">{t('landing.pricing')}</a>
            <button onClick={() => navigate('/login')} className="text-sm text-[#2C2622]/70 hover:text-[#C9A961] transition-colors font-medium">
              {t('auth.login')}
            </button>
            <button onClick={goSignup} className="px-5 py-2.5 bg-[#C9A961] text-white text-sm font-semibold rounded-full hover:bg-[#b8963a] active:scale-[0.97] transition-all">
              {t('landing.startFree')}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-12 h-12 flex items-center justify-center text-[#2C2622]/70"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF8F5] border-t border-[#C9A961]/10 px-5 py-6 space-y-1 animate-fade-in">
            {[
              { href: '#how', label: t('landing.howItWorks') },
              { href: '#gallery', label: t('landing.gallery') },
              { href: '#pricing', label: t('landing.pricing') },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-base text-[#2C2622]/70 active:text-[#C9A961]"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-[#C9A961]/10 !my-3" />
            <button onClick={() => navigate('/login')} className="block py-3 text-base text-[#2C2622]/70 font-medium w-full text-left">
              {t('auth.login')}
            </button>
            <button onClick={goSignup} className="w-full py-3.5 bg-[#C9A961] text-white text-sm font-semibold rounded-full mt-2 active:scale-[0.97]">
              {t('landing.startFree')}
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-10 lg:pt-40 lg:pb-28 px-5">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold mb-6 landing-stagger-1">
              <Sparkles size={14} />
              {t('landing.badge')}
            </div>

            <h2 className="text-[2.75rem] leading-[1.08] lg:text-6xl lg:leading-tight font-bold font-serif text-[#2C2622] mb-5 lg:mb-6 landing-stagger-2">
              {t('landing.heroTitle1')}
              <span className="text-[#C9A961]"> {t('landing.heroTitleGold')}</span>
              {t('landing.heroTitle2')}
            </h2>

            <div className="w-10 h-[2px] bg-gradient-to-r from-[#C9A961] to-[#C9A961]/30 mx-auto lg:mx-0 mb-5 landing-stagger-3" />

            <p className="text-[15px] lg:text-lg text-[#2C2622]/55 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed landing-stagger-3">
              {t('landing.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start landing-stagger-4">
              <button
                onClick={goSignup}
                className="cta-shine px-8 py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm active:scale-[0.97] hover:bg-[#b8963a] transition-all shadow-lg shadow-[#C9A961]/20"
              >
                {t('landing.ctaPrimary')}
              </button>
              <a
                href="#how"
                className="px-8 py-4 border border-[#2C2622]/15 text-[#2C2622]/70 font-medium rounded-full text-sm hover:border-[#C9A961]/40 hover:text-[#C9A961] active:bg-[#C9A961]/5 transition-all text-center"
              >
                {t('landing.ctaSecondary')}
              </a>
            </div>

            <p className="text-xs text-[#2C2622]/40 mt-4 landing-stagger-5">
              {t('landing.noCard')}
            </p>
          </div>

          {/* Before / After visual */}
          <div className="mt-10 lg:mt-0 landing-stagger-5">
            <div className="flex items-center gap-3 lg:gap-4 justify-center">
              {/* Before */}
              <div className="relative w-[42%] max-w-[200px]">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#d5d0c8] shadow-lg border-2 border-white/60">
                  <div className="w-full h-full bg-gradient-to-br from-[#c4bfb5] via-[#b8b2a6] to-[#a9a295] blur-[2px] flex items-center justify-center">
                    <div className="w-3/4 h-3/4 rounded-lg bg-[#bdb7ab]/80" />
                  </div>
                </div>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2C2622] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Avant
                </span>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <ArrowRight size={24} className="text-[#C9A961]" />
                <Sparkles size={14} className="text-[#C9A961]/60" />
              </div>

              {/* After */}
              <div className="relative w-[42%] max-w-[200px]">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-xl ring-2 ring-[#C9A961]/30">
                  <img
                    src={GALLERY_PHOTOS[0].url}
                    alt={GALLERY_PHOTOS[0].name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 pt-8">
                    <p className="text-white text-xs font-medium">{GALLERY_PHOTOS[0].name}</p>
                  </div>
                </div>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#C9A961] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Auguste
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ────────────────────────────────────────────── */}
      <section className="py-6 lg:py-8 border-y border-[#C9A961]/10 bg-white/40">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-4 gap-2 lg:gap-6 text-center">
            {STAT_ITEMS.map((s, i) => (
              <div key={i} className="py-1">
                <p className="text-xl lg:text-2xl font-bold font-serif text-[#C9A961]">{t(s.value)}</p>
                <p className="text-[10px] lg:text-xs text-[#2C2622]/50 leading-tight mt-0.5">{t(s.label)}</p>
              </div>
            ))}
          </div>
          {/* Platform compatibility */}
          <p className="text-center text-[10px] lg:text-xs text-[#2C2622]/40 mt-4 pt-4 border-t border-[#C9A961]/8">
            Compatible : Uber Eats &middot; Deliveroo &middot; Just Eat &middot; TheFork
          </p>
        </div>
      </section>

      {/* ── Problem section ─────────────────────────────────────────────── */}
      <section className="py-16 lg:py-28 px-5 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#D4895C] uppercase mb-3">
              {t('landing.problemLabel')}
            </p>
            <h3 className="text-2xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.problemTitle')}
            </h3>
          </div>

          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
            {PROBLEM_ITEMS.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 lg:flex-col bg-white rounded-2xl p-5 lg:p-7 border-l-[3px] lg:border-l-0 lg:border border-[#D4895C]/25 lg:border-[#D4895C]/15"
                >
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[#D4895C]/10 flex items-center justify-center shrink-0 lg:mb-3">
                    <Icon size={20} className="text-[#D4895C]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15px] lg:text-lg font-semibold text-[#2C2622] mb-1">{t(item.title)}</h4>
                    <p className="text-sm text-[#2C2622]/55 leading-relaxed">{t(item.desc)}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-center mt-8 lg:mt-10 text-base font-medium text-[#C9A961]">
            {t('landing.problemCta')}
          </p>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="py-16 lg:py-28 px-5 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.howLabel')}
            </p>
            <h3 className="text-2xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.howTitle')}
            </h3>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {STEP_ITEMS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.num} className={i < STEP_ITEMS.length - 1 ? 'step-connector' : ''}>
                  <div className="group relative bg-white rounded-2xl p-6 lg:p-7 border border-[#C9A961]/10 hover:border-[#C9A961]/30 transition-colors">
                    <div className="flex items-start gap-4 lg:flex-col">
                      <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center shrink-0 lg:mb-3">
                        <Icon size={22} className="text-[#C9A961]" />
                      </div>
                      <div className="min-w-0">
                        <div className="absolute top-5 right-5 lg:top-7 lg:right-7 text-4xl lg:text-5xl font-bold font-serif text-[#C9A961]/8">{step.num}</div>
                        <h4 className="text-[15px] lg:text-lg font-semibold text-[#2C2622] mb-1 lg:mb-2">{t(step.title)}</h4>
                        <p className="text-sm text-[#2C2622]/55 leading-relaxed">{t(step.desc)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Gallery preview ─────────────────────────────────────────────── */}
      <section id="gallery" className="py-16 lg:py-28 px-5 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.galleryLabel')}
            </p>
            <h3 className="text-2xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.galleryTitle')}
            </h3>
            <p className="text-sm text-[#2C2622]/40 mt-3 max-w-md mx-auto">
              {t('landing.gallerySubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {GALLERY_PHOTOS.map((photo, i) => (
              <div key={i} className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#F0EDE8]">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover transition-transform duration-500 lg:group-hover:scale-[1.05]"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" />
                {/* Category pill */}
                <div className="absolute top-2.5 left-2.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                  <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {photo.category}
                  </span>
                </div>
                {/* Dish name */}
                <div className="absolute bottom-0 left-0 right-0 p-3 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs font-medium">{photo.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-28 px-5 bg-[#2C2622]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.benefitsLabel')}
            </p>
            <h3 className="text-2xl lg:text-4xl font-bold font-serif text-white">
              {t('landing.benefitsTitle')}
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 lg:gap-6">
            {BENEFIT_ITEMS.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-4 sm:flex-col bg-white/5 rounded-2xl p-5 sm:p-7 border border-white/8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#C9A961]/15 flex items-center justify-center shrink-0 sm:mb-1">
                    <Icon size={20} className="text-[#C9A961]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15px] sm:text-lg font-semibold text-white mb-1">{t(item.title)}</h4>
                    <p className="text-sm text-white/45 leading-relaxed">{t(item.desc)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-28 bg-gradient-to-b from-white to-[#FAF8F5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 lg:mb-14 px-5">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.testimonialsLabel')}
            </p>
            <h3 className="text-2xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.testimonialsTitle')}
            </h3>
          </div>

          <div className="flex lg:grid lg:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 lg:pb-0 px-5 lg:overflow-visible">
            {TESTIMONIAL_ITEMS.map((item, i) => (
              <div
                key={i}
                className="shrink-0 w-[82vw] sm:w-[70vw] lg:w-auto snap-center bg-white rounded-2xl p-6 lg:p-7 border border-[#C9A961]/10"
              >
                {/* Metric pull-quote */}
                <p className="text-lg font-bold font-serif text-[#C9A961] mb-3">
                  {TESTIMONIAL_METRICS[i]}
                </p>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="text-[#C9A961] fill-[#C9A961]" />
                  ))}
                </div>
                <p className="text-sm text-[#2C2622]/70 leading-relaxed mb-5 italic">
                  &ldquo;{t(item.quote)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center text-sm font-bold text-[#C9A961]">
                    {t(item.name).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2622]">{t(item.name)}</p>
                    <p className="text-xs text-[#2C2622]/45">{t(item.role)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 lg:py-28 px-5 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.pricingLabel')}
            </p>
            <h3 className="text-2xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.pricingTitle')}
            </h3>
            <p className="text-sm text-[#D4895C] font-medium mt-3">
              vs 500-2 000&euro; un photographe
            </p>
          </div>

          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5">
            {/* Pro — highlighted (first on mobile via order) */}
            <div className="bg-[#2C2622] rounded-2xl p-6 lg:p-7 text-white relative ring-2 ring-[#C9A961]/40 order-first lg:order-none">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C9A961] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                {t('landing.popular')}
              </div>
              <p className="text-xs font-semibold text-[#C9A961] uppercase tracking-wider mb-1">{t('landing.planProName')}</p>
              <p className="text-3xl font-bold font-serif mb-1">25<span className="text-base font-sans font-normal text-white/40"> &euro;</span></p>
              <p className="text-xs text-white/40 mb-5">30 photos</p>
              <ul className="space-y-2.5 mb-6">
                {(['landing.planProF1', 'landing.planProF2', 'landing.planProF3'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 text-sm text-white/65">
                    <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                    {t(k)}
                  </li>
                ))}
              </ul>
              <button onClick={goSignup} className="cta-shine w-full py-3.5 bg-[#C9A961] text-white font-semibold rounded-full text-sm active:scale-[0.97] hover:bg-[#b8963a] transition-all">
                {t('landing.choosePlan')}
              </button>
            </div>

            {/* Starter */}
            <div className="bg-white rounded-2xl p-6 lg:p-7 border border-[#C9A961]/10 lg:order-first">
              <p className="text-xs font-semibold text-[#C9A961] uppercase tracking-wider mb-1">{t('landing.planStarterName')}</p>
              <p className="text-3xl font-bold font-serif text-[#2C2622] mb-1">19<span className="text-base font-sans font-normal text-[#2C2622]/40"> &euro;</span></p>
              <p className="text-xs text-[#2C2622]/45 mb-5">20 photos</p>
              <ul className="space-y-2.5 mb-6">
                {(['landing.planStarterF1', 'landing.planStarterF2', 'landing.planStarterF3'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                    <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                    {t(k)}
                  </li>
                ))}
              </ul>
              <button onClick={goSignup} className="w-full py-3.5 border border-[#C9A961]/30 text-[#C9A961] font-semibold rounded-full text-sm active:bg-[#C9A961]/5 hover:bg-[#C9A961]/5 transition-colors">
                {t('landing.choosePlan')}
              </button>
            </div>

            {/* Restaurant */}
            <div className="bg-white rounded-2xl p-6 lg:p-7 border border-[#C9A961]/10">
              <p className="text-xs font-semibold text-[#C9A961] uppercase tracking-wider mb-1">{t('landing.planRestoName')}</p>
              <p className="text-3xl font-bold font-serif text-[#2C2622] mb-1">35<span className="text-base font-sans font-normal text-[#2C2622]/40"> &euro;</span></p>
              <p className="text-xs text-[#2C2622]/45 mb-5">50 photos</p>
              <ul className="space-y-2.5 mb-6">
                {(['landing.planRestoF1', 'landing.planRestoF2', 'landing.planRestoF3'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 text-sm text-[#2C2622]/65">
                    <ChevronRight size={14} className="text-[#C9A961] mt-0.5 shrink-0" />
                    {t(k)}
                  </li>
                ))}
              </ul>
              <button onClick={goSignup} className="w-full py-3.5 border border-[#C9A961]/30 text-[#C9A961] font-semibold rounded-full text-sm active:bg-[#C9A961]/5 hover:bg-[#C9A961]/5 transition-colors">
                {t('landing.choosePlan')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-28 px-5 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#C9A961] uppercase mb-3">
              {t('landing.faqLabel')}
            </p>
            <h3 className="text-2xl lg:text-4xl font-bold font-serif text-[#2C2622]">
              {t('landing.faqTitle')}
            </h3>
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#C9A961]/10 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 min-h-[56px] text-left active:bg-[#C9A961]/3"
                >
                  <span className="text-[15px] font-semibold text-[#2C2622] pr-4 leading-snug">{t(faq.q)}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#C9A961] shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className="faq-answer" data-open={openFaq === i}>
                  <div>
                    <div className="px-5 pb-5">
                      <p className="text-sm text-[#2C2622]/55 leading-relaxed">{t(faq.a)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 px-5 bg-[#2C2622] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#C9A961]/5 blur-[100px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative">
          <h3 className="text-[1.75rem] lg:text-4xl font-bold font-serif text-white mb-4 leading-tight">
            {t('landing.ctaTitle')}
          </h3>
          <p className="text-sm text-white/45 mb-8 max-w-sm mx-auto leading-relaxed">
            {t('landing.ctaSubtitle')}
          </p>
          <button
            onClick={goSignup}
            className="cta-shine w-full sm:w-auto px-10 py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm active:scale-[0.97] hover:bg-[#b8963a] transition-all shadow-lg shadow-[#C9A961]/30"
          >
            {t('landing.ctaPrimary')}
          </button>
          <p className="text-xs text-white/25 mt-4">
            {t('landing.ctaTrust')}
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 lg:py-10 px-5 border-t border-[#C9A961]/10">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
          <p className="text-sm font-serif font-bold text-[#C9A961]">Auguste</p>
          <div className="flex items-center gap-5">
            <Link to="/cgu" className="text-xs text-[#2C2622]/35 active:text-[#C9A961] hover:text-[#C9A961] transition-colors">CGU</Link>
            <Link to="/mentions-legales" className="text-xs text-[#2C2622]/35 active:text-[#C9A961] hover:text-[#C9A961] transition-colors">Mentions legales</Link>
            <Link to="/confidentialite" className="text-xs text-[#2C2622]/35 active:text-[#C9A961] hover:text-[#C9A961] transition-colors">Confidentialite</Link>
          </div>
          <p className="text-xs text-[#2C2622]/35">
            &copy; {new Date().getFullYear()} Auguste. {t('landing.footerRights')}
          </p>
        </div>
      </footer>
    </div>
  )
}
