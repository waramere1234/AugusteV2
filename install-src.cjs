const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Delete existing src directory
fs.rmSync(srcDir, { recursive: true, force: true });

// Create all directories
fs.mkdirSync(path.join(srcDir, 'types'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'lib'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'hooks'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'components', 'layout'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'pages'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'constants'), { recursive: true });

// App.tsx
fs.writeFileSync(
  path.join(srcDir, 'App.tsx'),
  `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { I18nProvider } from '@/lib/i18n'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { MenuPage } from '@/pages/MenuPage'
import { PhotosPage } from '@/pages/PhotosPage'
import { ExportPage } from '@/pages/ExportPage'

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-serif text-[#C9A961] mb-2">Auguste</h1>
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout />
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoutes />}>
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/photos" element={<PhotosPage />} />
              <Route path="/export" element={<ExportPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/profil" replace />} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}
`
);

// main.tsx
fs.writeFileSync(
  path.join(srcDir, 'main.tsx'),
  `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`
);

// index.css
fs.writeFileSync(
  path.join(srcDir, 'index.css'),
  `@import "tailwindcss";

/* ── Auguste Design Tokens ──────────────────────────────────────────────────── */
@theme {
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
}

/* ── Base resets ────────────────────────────────────────────────────────────── */
body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #FAF8F5;
}

/* ── Safe area for mobile (notch + home indicator) ─────────────────────────── */
html {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left);
}

/* ── Smooth scrolling ──────────────────────────────────────────────────────── */
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* ── Remove tap highlight on mobile ────────────────────────────────────────── */
* {
  -webkit-tap-highlight-color: transparent;
}
`
);

// types/index.ts
fs.writeFileSync(
  path.join(srcDir, 'types', 'index.ts'),
  `// ── Menu item sub-types (jsonb columns) ──────────────────────────────────────

export interface Taille {
  label: string;   // "S", "M", "L", "30cm", "Pièce"
  prix: number;
}

export interface Supplement {
  nom: string;          // "Fromage", "Bacon"
  prix: number;         // 2.00
  obligatoire: boolean; // true = le client doit choisir
}

export interface Accompagnement {
  nom: string;     // "Frites", "Salade"
  prix: number;    // 0 si inclus
  inclus: boolean; // true = pas de surcoût
}

// ── MenuItem ─────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  nom: string;
  categorie: string;
  description: string;
  prix: string;
  style: string;
  image_url?: string;
  tailles?: Taille[];
  supplements?: Supplement[];
  accompagnements?: Accompagnement[];
  allergenes?: string[];
  labels?: string[];
  disponible?: boolean;
  item_type?: 'plat' | 'formule' | 'boisson' | 'dessert';
  image_source?: 'platform' | 'generated' | 'user' | null;
  position?: number;
}

// ── Restaurant (NEW — v2 pivot) ─────────────────────────────────────────────
export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  cuisine_profile_id: string | null;
  cuisine_types: string[];
  address: string | null;
  phone: string | null;
  description: string | null;
  style_photo_url: string | null;
  dish_reference_url: string | null;
  hero_photo_url: string | null;
  google_place_id: string | null;
  google_business_data: GoogleBusinessData | null;
  presentation_style_id: string | null;
  style_description: string | null;
  logo_url: string | null;
  created_at: string;
}

// ── Menu ─────────────────────────────────────────────────────────────────────
export interface Menu {
  id: string;
  restaurant_id: string;
  file_name: string;
  source_type: 'file' | 'url' | 'photo';
  detected_cuisine_profile: string | null;
  hero_photo_url: string | null;
  category_order: string[] | null;
  created_at: string;
  items: MenuItem[];
}

// ── Google Business Data ─────────────────────────────────────────────────────
export interface GoogleBusinessData {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  rating: number | null;
  reviews_count: number;
  hours: string[];
  description: string;
  cuisine_types: string[];
  primary_type: string;
  primary_type_display: string;
  detected_cuisine_profile: string | null;
  website: string;
  google_maps_url: string;
  photo_references: string[];
  photo_urls: string[];
}

// ── Image Generation ─────────────────────────────────────────────────────────
export interface ImageRequest {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  quality?: 'standard' | 'premium';
  cuisineProfile?: string;
  cuisineTypes?: string[];
  restaurantPhotoBase64?: string;
  dishReferenceBase64?: string;
  userInstructions?: string;
  siblingImageBase64?: string;
}

export interface GeneratedImage {
  item_id: string;
  image_url: string;
  prompt?: string;
  created_at: string;
}

// ── User / Credits ───────────────────────────────────────────────────────────
export interface UserCredits {
  credits_used: number;
  credits_purchased: number;
  remaining: number;
}
`
);

// lib/supabase.ts
fs.writeFileSync(
  path.join(srcDir, 'lib', 'supabase.ts'),
  `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing — check .env.local')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

/**
 * Ensure a valid session before calling Edge Functions.
 * Refreshes token if expired.
 */
export async function ensureSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) throw new Error('Session expired — please log in again')
  }
}
`
);

// lib/auth.tsx
fs.writeFileSync(
  path.join(srcDir, 'lib', 'auth.tsx'),
  `import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
`
);

// lib/i18n.tsx
fs.writeFileSync(
  path.join(srcDir, 'lib', 'i18n.tsx'),
  `import { createContext, useContext, useState, type ReactNode } from 'react'

type Lang = 'fr' | 'en'

const translations = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  'nav.profile': { fr: 'Mon resto', en: 'My restaurant' },
  'nav.menu': { fr: 'Ma carte', en: 'My menu' },
  'nav.photos': { fr: 'Photos', en: 'Photos' },
  'nav.export': { fr: 'Exporter', en: 'Export' },

  // ── Auth ────────────────────────────────────────────────────────────────────
  'auth.login': { fr: 'Connexion', en: 'Log in' },
  'auth.signup': { fr: 'Inscription', en: 'Sign up' },
  'auth.logout': { fr: 'Déconnexion', en: 'Log out' },
  'auth.email': { fr: 'Email', en: 'Email' },
  'auth.password': { fr: 'Mot de passe', en: 'Password' },

  // ── Profile ─────────────────────────────────────────────────────────────────
  'profile.title': { fr: 'Mon Restaurant', en: 'My Restaurant' },
  'profile.name': { fr: 'Nom du restaurant', en: 'Restaurant name' },
  'profile.cuisine': { fr: 'Type de cuisine', en: 'Cuisine type' },
  'profile.photo': { fr: 'Photo du restaurant', en: 'Restaurant photo' },
  'profile.photo.optional': { fr: 'Optionnel', en: 'Optional' },
  'profile.google': { fr: 'Chercher sur Google', en: 'Search on Google' },
  'profile.menus': { fr: 'Mes menus', en: 'My menus' },
  'profile.addMenu': { fr: 'Ajouter mon menu', en: 'Add my menu' },
  'profile.credits': { fr: 'Crédits restants', en: 'Remaining credits' },

  // ── Menu ────────────────────────────────────────────────────────────────────
  'menu.title': { fr: 'Ma Carte', en: 'My Menu' },
  'menu.import.photo': { fr: 'Prendre en photo', en: 'Take a photo' },
  'menu.import.file': { fr: 'Importer un fichier', en: 'Upload a file' },
  'menu.import.link': { fr: 'Coller un lien', en: 'Paste a link' },
  'menu.edit': { fr: 'Éditer', en: 'Edit' },
  'menu.generate': { fr: 'Générer les photos', en: 'Generate photos' },
  'menu.generateAll': { fr: 'Générer toutes les photos', en: 'Generate all photos' },
  'menu.generateSelected': { fr: 'Générer la sélection', en: 'Generate selected' },
  'menu.editFirst': { fr: 'Éditer d\\'abord', en: 'Edit first' },

  // ── Photos ──────────────────────────────────────────────────────────────────
  'photos.title': { fr: 'Photos', en: 'Photos' },
  'photos.gallery': { fr: 'Galerie', en: 'Gallery' },
  'photos.pending': { fr: 'En attente', en: 'Pending' },
  'photos.regenerate': { fr: 'Régénérer', en: 'Regenerate' },
  'photos.download': { fr: 'Télécharger', en: 'Download' },

  // ── Export ──────────────────────────────────────────────────────────────────
  'export.title': { fr: 'Exporter', en: 'Export' },
  'export.pdf': { fr: 'Menu PDF', en: 'PDF Menu' },
  'export.zip': { fr: 'Photos ZIP', en: 'Photos ZIP' },
  'export.uber': { fr: 'CSV Uber Eats', en: 'CSV Uber Eats' },
  'export.deliveroo': { fr: 'CSV Deliveroo', en: 'CSV Deliveroo' },
  'export.web': { fr: 'Lien web + QR', en: 'Web link + QR' },

  // ── Common ──────────────────────────────────────────────────────────────────
  'common.save': { fr: 'Enregistrer', en: 'Save' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel' },
  'common.loading': { fr: 'Chargement...', en: 'Loading...' },
  'common.error': { fr: 'Erreur', en: 'Error' },
  'common.buy': { fr: 'Acheter', en: 'Buy' },
} as const

type TranslationKey = keyof typeof translations

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')

  function t(key: TranslationKey): string {
    return translations[key]?.[lang] ?? key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
`
);

// hooks/useRestaurant.ts
fs.writeFileSync(
  path.join(srcDir, 'hooks', 'useRestaurant.ts'),
  `import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { Restaurant } from '@/types'

interface UseRestaurantReturn {
  restaurant: Restaurant | null
  loading: boolean
  saving: boolean
  error: string | null
  updateRestaurant: (updates: Partial<Restaurant>) => Promise<void>
}

export function useRestaurant(): UseRestaurantReturn {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch or auto-create restaurant on mount
  useEffect(() => {
    if (!user) {
      setRestaurant(null)
      setLoading(false)
      return
    }

    async function loadOrCreate() {
      setLoading(true)
      setError(null)

      try {
        // Try to fetch existing restaurant
        const { data, error: fetchError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user!.id)
          .maybeSingle()

        if (fetchError) throw fetchError

        if (data) {
          setRestaurant(data as Restaurant)
        } else {
          // Auto-create empty restaurant for this user
          const { data: newRestaurant, error: insertError } = await supabase
            .from('restaurants')
            .insert({ owner_id: user!.id, name: '' })
            .select()
            .single()

          if (insertError) throw insertError
          setRestaurant(newRestaurant as Restaurant)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(message)
        console.error('useRestaurant error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOrCreate()
  }, [user])

  // Update restaurant fields
  const updateRestaurant = useCallback(async (updates: Partial<Restaurant>) => {
    if (!restaurant) return

    setSaving(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurant.id)
        .select()
        .single()

      if (updateError) throw updateError
      setRestaurant(data as Restaurant)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur sauvegarde'
      setError(message)
      console.error('updateRestaurant error:', err)
    } finally {
      setSaving(false)
    }
  }, [restaurant])

  return { restaurant, loading, saving, error, updateRestaurant }
}
`
);

// components/layout/AppLayout.tsx
fs.writeFileSync(
  path.join(srcDir, 'components', 'layout', 'AppLayout.tsx'),
  `import { Outlet } from 'react-router-dom'
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
`
);

// components/layout/BottomNav.tsx
fs.writeFileSync(
  path.join(srcDir, 'components', 'layout', 'BottomNav.tsx'),
  `import { NavLink } from 'react-router-dom'
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
              \`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[64px] \${
                isActive
                  ? 'text-[#C9A961]'
                  : 'text-gray-400 active:text-gray-600'
              }\`
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
`
);

// components/layout/Sidebar.tsx
fs.writeFileSync(
  path.join(srcDir, 'components', 'layout', 'Sidebar.tsx'),
  `import { NavLink } from 'react-router-dom'
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
              \`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${
                isActive
                  ? 'bg-[#C9A961]/10 text-[#C9A961]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }\`
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
`
);

// pages/LoginPage.tsx
fs.writeFileSync(
  path.join(srcDir, 'pages', 'LoginPage.tsx'),
  `import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function LoginPage() {
  const { t } = useI18n()
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      navigate('/profil')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold font-serif text-[#C9A961]">Auguste</h1>
        <p className="text-sm text-gray-500 mt-2">
          Des photos pro pour votre carte, en 3 minutes
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email')}
            required
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-[#C9A961] outline-none bg-white transition-colors"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password')}
            required
            minLength={6}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-[#C9A961] outline-none bg-white transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#C9A961] text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? t('common.loading') : isSignUp ? t('auth.signup') : t('auth.login')}
        </button>

        <p className="text-center text-sm text-gray-500">
          {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#C9A961] font-medium"
          >
            {isSignUp ? t('auth.login') : t('auth.signup')}
          </button>
        </p>
      </form>
    </div>
  )
}
`
);

// pages/ProfilePage.tsx
fs.writeFileSync(
  path.join(srcDir, 'pages', 'ProfilePage.tsx'),
  `import { useState, useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useRestaurant } from '@/hooks/useRestaurant'
import { CUISINE_PROFILES } from '@/constants/cuisineProfiles'

export function ProfilePage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { restaurant, loading, saving, updateRestaurant } = useRestaurant()

  const [name, setName] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null)
  const nameTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local state when restaurant loads
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name)
      setSelectedCuisine(restaurant.cuisine_profile_id)
    }
  }, [restaurant])

  // Auto-save name after 800ms of no typing
  function handleNameChange(value: string) {
    setName(value)
    if (nameTimeout.current) clearTimeout(nameTimeout.current)
    nameTimeout.current = setTimeout(() => {
      updateRestaurant({ name: value })
    }, 800)
  }

  // Save cuisine profile immediately on tap
  function handleCuisineSelect(profileId: string) {
    const newValue = profileId === selectedCuisine ? null : profileId
    setSelectedCuisine(newValue)
    updateRestaurant({ cuisine_profile_id: newValue })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative h-40 bg-gradient-to-br from-[#C9A961]/30 to-[#D4895C]/20 rounded-2xl flex items-end p-5">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#2C2622]">
            {t('profile.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>
        {saving && (
          <span className="absolute top-4 right-4 text-xs text-[#C9A961] bg-[#C9A961]/10 px-2 py-1 rounded-full">
            Sauvegarde...
          </span>
        )}
      </div>

      {/* Restaurant name */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {t('profile.name')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Le Petit Bistrot..."
          className="w-full text-lg font-semibold text-[#2C2622] border-b-2 border-gray-200 focus:border-[#C9A961] outline-none pb-2 bg-transparent transition-colors"
        />
      </section>

      {/* Google Card search */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {t('profile.google')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Chercher mon restaurant sur Google..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] outline-none transition-colors"
          />
          <button className="px-4 py-3 bg-[#C9A961] text-white rounded-lg text-sm font-medium active:scale-95 transition-transform">
            Chercher
          </button>
        </div>
      </section>

      {/* Cuisine profile selector */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-500 mb-3">
          {t('profile.cuisine')}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {CUISINE_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleCuisineSelect(profile.id)}
              className={\`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors \${
                selectedCuisine === profile.id
                  ? 'border-[#C9A961] bg-[#C9A961]/5'
                  : 'border-transparent hover:border-[#C9A961]/40 active:border-[#C9A961]'
              }\`}
            >
              <span className="text-2xl">{profile.emoji}</span>
              <span className="text-xs text-gray-600 text-center leading-tight">
                {profile.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Restaurant photo (optional) */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {t('profile.photo')}
          <span className="ml-2 text-xs text-gray-400">({t('profile.photo.optional')})</span>
        </label>
        <button className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 active:border-[#C9A961] active:text-[#C9A961] transition-colors">
          <span className="text-3xl">📷</span>
          <span className="text-sm">{t('menu.import.photo')}</span>
        </button>
      </section>

      {/* Menus list */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2C2622]">{t('profile.menus')}</h2>
        </div>
        <button className="w-full py-4 border-2 border-dashed border-[#C9A961]/40 rounded-xl text-[#C9A961] font-medium text-sm active:bg-[#C9A961]/5 transition-colors">
          + {t('profile.addMenu')}
        </button>
      </section>

      {/* Credits */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('profile.credits')}</p>
            <p className="text-2xl font-bold text-[#C9A961]">10</p>
          </div>
          <button className="px-5 py-2.5 bg-[#C9A961] text-white rounded-lg text-sm font-medium active:scale-95 transition-transform">
            {t('common.buy')}
          </button>
        </div>
      </section>
    </div>
  )
}
`
);

// pages/MenuPage.tsx
fs.writeFileSync(
  path.join(srcDir, 'pages', 'MenuPage.tsx'),
  `import { useI18n } from '@/lib/i18n'

export function MenuPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('menu.title')}</h1>

      {/* Import options — 3 big buttons */}
      <div className="grid grid-cols-1 gap-3">
        <button className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm active:bg-gray-50 transition-colors text-left">
          <span className="text-3xl">📷</span>
          <div>
            <p className="font-semibold text-[#2C2622]">{t('menu.import.photo')}</p>
            <p className="text-sm text-gray-500">Photographier votre carte</p>
          </div>
        </button>

        <button className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm active:bg-gray-50 transition-colors text-left">
          <span className="text-3xl">📄</span>
          <div>
            <p className="font-semibold text-[#2C2622]">{t('menu.import.file')}</p>
            <p className="text-sm text-gray-500">PDF ou image depuis votre galerie</p>
          </div>
        </button>

        <button className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm active:bg-gray-50 transition-colors text-left">
          <span className="text-3xl">🔗</span>
          <div>
            <p className="font-semibold text-[#2C2622]">{t('menu.import.link')}</p>
            <p className="text-sm text-gray-500">Uber Eats, Deliveroo, Just Eat</p>
          </div>
        </button>
      </div>

      {/* Empty state */}
      <div className="text-center py-12 text-gray-400">
        <p className="text-5xl mb-4">🍽️</p>
        <p className="text-sm">Importez votre menu pour commencer</p>
      </div>
    </div>
  )
}
`
);

// pages/PhotosPage.tsx
fs.writeFileSync(
  path.join(srcDir, 'pages', 'PhotosPage.tsx'),
  `import { useI18n } from '@/lib/i18n'

export function PhotosPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('photos.title')}</h1>

      {/* Empty state */}
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">📷</p>
        <p className="text-sm mb-2">Aucune photo générée</p>
        <p className="text-xs text-gray-300">Importez un menu puis générez des photos IA</p>
      </div>
    </div>
  )
}
`
);

// pages/ExportPage.tsx
fs.writeFileSync(
  path.join(srcDir, 'pages', 'ExportPage.tsx'),
  `import { useI18n } from '@/lib/i18n'
import { FileText, Image, FileSpreadsheet, Globe } from 'lucide-react'

const exportOptions = [
  { icon: FileText, labelKey: 'export.pdf' as const, desc: '14 thèmes visuels', ready: true },
  { icon: Image, labelKey: 'export.zip' as const, desc: 'Haute résolution', ready: true },
  { icon: FileSpreadsheet, labelKey: 'export.uber' as const, desc: 'Format conforme', ready: false },
  { icon: FileSpreadsheet, labelKey: 'export.deliveroo' as const, desc: 'Format conforme', ready: false },
  { icon: Globe, labelKey: 'export.web' as const, desc: 'Menu en ligne + QR code', ready: false },
]

export function ExportPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('export.title')}</h1>

      <div className="grid grid-cols-1 gap-3">
        {exportOptions.map(({ icon: Icon, labelKey, desc, ready }) => (
          <button
            key={labelKey}
            disabled={!ready}
            className={\`flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm text-left transition-colors \${
              ready
                ? 'active:bg-gray-50'
                : 'opacity-50 cursor-not-allowed'
            }\`}
          >
            <div className={\`p-3 rounded-lg \${ready ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}\`}>
              <Icon size={24} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#2C2622]">{t(labelKey)}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
            {!ready && (
              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">
                Bientôt
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
`
);

// constants/cuisineProfiles.ts
fs.writeFileSync(
  path.join(srcDir, 'constants', 'cuisineProfiles.ts'),
  `// ── Cuisine Profiles ─────────────────────────────────────────────────────────
// Deuxième dimension de la génération d'images :
//   CATEGORY_STYLES (dans generate-dish-photo) = QUOI (burger, sandwich, dessert)
//   CUISINE_PROFILES                           = OÙ  (kebab, boulangerie, gastro)
//
// Chaque catégorie du menu se voit assigner un cuisine_profile.
// Le prompt combine les deux pour des images culturellement précises.
// ─────────────────────────────────────────────────────────────────────────────

export interface CuisineProfile {
  id: string;
  emoji: string;
  label: string;           // Nom affiché dans l'UI (FR)
  bread: string;           // Type de pain/base par défaut
  serving: string;         // Contenant/service typique
  sauce: string;           // Sauces / condiments typiques
  ambiance: string;        // Ambiance visuelle globale
  cultural_context: string; // Instruction culturelle pour le prompt IA
}

export const CUISINE_PROFILES: CuisineProfile[] = [
  // ── Street food & Fast-casual ──────────────────────────────────────────────
  {
    id: 'kebab',
    emoji: '🥙',
    label: 'Kebab / Turc',
    bread: 'pain turc (galette turque moelleuse) ou pain pita épais',
    serving: 'barquette aluminium, papier kraft, ou assiette simple',
    sauce: 'sauce blanche, sauce samouraï, sauce harissa',
    ambiance: 'warm street food lighting, casual fast-food atmosphere, vibrant and hearty',
    cultural_context: 'Turkish/French kebab shop. "Tacos" means FRENCH TACOS (grilled closed tortilla with meat, fries, and melted cheese sauce). Sandwiches use Turkish bread (galette), not baguette. Generous portions, melted cheese, grilled meat.',
  },
  {
    id: 'burger',
    emoji: '🍔',
    label: 'Burger',
    bread: 'brioche bun doré avec graines de sésame',
    serving: 'papier kraft, planche ardoise, ou panier métallique',
    sauce: 'ketchup, sauce burger maison, cheddar fondu',
    ambiance: 'dark moody lighting, American diner or modern burger joint vibe',
    cultural_context: 'Burger restaurant. Brioche buns, smashed or classic patties. Melted cheese dripping. American-style or gourmet burger presentation.',
  },
  {
    id: 'pizza',
    emoji: '🍕',
    label: 'Pizzeria',
    bread: 'pâte à pizza fine ou napolitaine (bord gonflé, charred)',
    serving: 'planche en bois ronde, assiette plate, ou carton pizza',
    sauce: 'sauce tomate, huile d\\'olive, basilic frais',
    ambiance: 'warm rustic Italian trattoria, wood-fired oven glow, casual Mediterranean',
    cultural_context: 'Italian pizzeria. Wood-fired style, authentic Italian presentation. Calzones, antipasti, bruschetta follow Italian tradition.',
  },
  {
    id: 'tacos_fr',
    emoji: '🌯',
    label: 'Tacos Français',
    bread: 'tortilla de blé grillée et fermée (panini-press style, golden grill marks)',
    serving: 'papier kraft, barquette, emballage aluminium',
    sauce: 'sauce fromagère fondue, sauce algérienne, sauce blanche',
    ambiance: 'urban street food, bold fast-casual, generous and indulgent',
    cultural_context: 'French tacos restaurant. IMPORTANT: "Tacos" here is a FRENCH TACOS — a large grilled closed wheat tortilla filled with meat, fries, and melted cheese sauce. NOT Mexican tacos. Always show as a closed, pressed, golden-brown grilled wrap.',
  },
  {
    id: 'riz_crousty',
    emoji: '🍚',
    label: 'Riz Crousty',
    bread: 'base de riz blanc',
    serving: 'box noire ou container takeaway, bol noir',
    sauce: 'sauce fromagère blanche, sauce piquante orange, zigzag pattern',
    ambiance: 'modern street food, ASMR-style close-up, bold contrast black container',
    cultural_context: 'Crispy rice (riz crousty) restaurant. White rice base topped with golden crispy breaded chicken, dual sauce drizzle (white cheese + spicy orange) in zigzag pattern. Trendy French street food concept.',
  },
  {
    id: 'sandwich_boulangerie',
    emoji: '🥖',
    label: 'Boulangerie / Sandwicherie',
    bread: 'baguette tradition croustillante ou pain de campagne',
    serving: 'papier kraft, planche en bois, vitrine boulangerie',
    sauce: 'beurre, moutarde, mayonnaise maison',
    ambiance: 'warm natural light, artisan bakery atmosphere, rustic French charm',
    cultural_context: 'French bakery/sandwich shop. Sandwiches use traditional baguette or country bread. Classic French fillings (jambon-beurre, poulet crudités). Pastries and viennoiseries in artisan bakery style.',
  },
  {
    id: 'poulet_frit',
    emoji: '🍗',
    label: 'Poulet Frit / Chicken',
    bread: 'pain burger moelleux ou sans pain (poulet seul)',
    serving: 'bucket, barquette kraft, panier métallique avec papier',
    sauce: 'sauce BBQ, honey mustard, sauce piquante',
    ambiance: 'bold fast-food style, crispy textures, American fried chicken vibe',
    cultural_context: 'Fried chicken restaurant. Golden crispy coating, crunchy texture visible. Served in buckets, baskets, or boxes. Bold, generous, American-style presentation.',
  },
  {
    id: 'fish_and_chips',
    emoji: '🐟',
    label: 'Fish & Chips',
    bread: 'pas de pain — pané croustillant doré',
    serving: 'cornet de papier journal ou barquette kraft',
    sauce: 'tartar sauce, vinaigre de malt, citron',
    ambiance: 'British pub atmosphere, casual and hearty, golden fried tones',
    cultural_context: 'Fish and chips shop. Golden crispy battered fish, thick-cut chips. Served in newspaper cone or kraft tray. British pub style.',
  },
  {
    id: 'hot_dog',
    emoji: '🌭',
    label: 'Hot-Dog',
    bread: 'pain à hot-dog vapeur moelleux',
    serving: 'barquette kraft, papier aluminium, plateau street food',
    sauce: 'moutarde américaine, ketchup, oignons frits',
    ambiance: 'American street food cart, colorful toppings, fun casual vibe',
    cultural_context: 'Hot dog stand/restaurant. Steamed soft buns, sausage extending past the bun. American-style toppings.',
  },

  // ── Asie ────────────────────────────────────────────────────────────────────
  {
    id: 'japonais',
    emoji: '🍣',
    label: 'Japonais',
    bread: 'riz à sushi vinaigré, pas de pain',
    serving: 'plateau noir laqué, céramique noire, planche en bois de bambou',
    sauce: 'sauce soja, wasabi, gingembre mariné',
    ambiance: 'minimalist Japanese aesthetic, dark surfaces, zen elegance, precise arrangement',
    cultural_context: 'Japanese restaurant. Sushi, sashimi, ramen, bento. Minimalist precise presentation. Black ceramics, bamboo, chopsticks. Clean, zen aesthetic.',
  },
  {
    id: 'chinois',
    emoji: '🥡',
    label: 'Chinois',
    bread: 'riz blanc, nouilles, baozi (brioche vapeur)',
    serving: 'bol profond en céramique, boîte takeaway, assiette ronde',
    sauce: 'sauce soja, sauce aigre-douce, huile de sésame',
    ambiance: 'warm golden lighting, bustling Chinese restaurant feel, steam and wok hei',
    cultural_context: 'Chinese restaurant. Wok-fried dishes, dim sum, noodle soups. Deep bowls, chopsticks. Steam rising, glossy sauce, vibrant stir-fry colors.',
  },
  {
    id: 'thai',
    emoji: '🍜',
    label: 'Thaïlandais',
    bread: 'riz jasmin, nouilles de riz',
    serving: 'bol en bois ou céramique, assiette avec feuille de bananier',
    sauce: 'curry (vert, rouge, jaune), sauce pad thai, lait de coco',
    ambiance: 'vibrant tropical colors, warm golden light, fresh herbs, aromatic feel',
    cultural_context: 'Thai restaurant. Curries, pad thai, som tam. Fresh herbs (basil, cilantro, lime). Colorful, aromatic, served in bowls with jasmine rice.',
  },
  {
    id: 'vietnamien',
    emoji: '🍲',
    label: 'Vietnamien',
    bread: 'bánh mì (baguette vietnamienne croustillante), nouilles de riz',
    serving: 'bol profond pour phở, assiette plate, panier en bambou',
    sauce: 'nuoc mam, sauce hoisin, sriracha',
    ambiance: 'light and fresh, clear broth, abundant fresh herbs, delicate and aromatic',
    cultural_context: 'Vietnamese restaurant. Phở, bánh mì, bò bún, nems. Fresh herbs (mint, cilantro, basil), bean sprouts, lime. Clear aromatic broth, light and healthy aesthetic.',
  },
  {
    id: 'coreen',
    emoji: '🍱',
    label: 'Coréen',
    bread: 'riz blanc, pas de pain',
    serving: 'bol en pierre chauffé (dolsot), petits plats banchan, plateau compartimenté',
    sauce: 'gochujang, sauce soja coréenne, kimchi',
    ambiance: 'warm hearty feel, sizzling hot stone bowl, colorful banchan array',
    cultural_context: 'Korean restaurant. Bibimbap, Korean BBQ, japchae, kimchi. Stone bowls, banchan side dishes. Sizzling, colorful, generous.',
  },
  {
    id: 'indien',
    emoji: '🍛',
    label: 'Indien',
    bread: 'naan, chapati, riz basmati',
    serving: 'thali (plateau compartimenté), bol en inox, plat en cuivre',
    sauce: 'curry onctueux, raita, chutney de mangue',
    ambiance: 'rich warm spice colors (turmeric, saffron), aromatic and inviting, copper accents',
    cultural_context: 'Indian restaurant. Curries, tandoori, biryani, naan. Rich creamy sauces, vibrant spice colors. Copper/steel bowls, naan bread, basmati rice.',
  },
  {
    id: 'asiatique_fusion',
    emoji: '🥢',
    label: 'Asiatique Fusion',
    bread: 'bao buns, riz, nouilles variées',
    serving: 'céramique moderne, bol design, planche en ardoise',
    sauce: 'sauce teriyaki, mayo sriracha, ponzu',
    ambiance: 'modern sleek dark surfaces, neon accents, urban contemporary Asian',
    cultural_context: 'Asian fusion restaurant. Modern mix of Japanese, Chinese, Thai, Korean influences. Sleek modern presentation, creative plating, contemporary urban vibe.',
  },
  {
    id: 'bubble_tea',
    emoji: '🧋',
    label: 'Bubble Tea',
    bread: 'pas de pain — boissons uniquement',
    serving: 'gobelet transparent avec couvercle dôme, paille large',
    sauce: 'sirop de fruits, lait, perles de tapioca',
    ambiance: 'pastel colors, kawaii aesthetic, bright and playful, Instagram-worthy',
    cultural_context: 'Bubble tea shop. Transparent cups showing colorful layers, visible tapioca pearls at bottom. Bright pastel aesthetic, dome lid, wide straw. Clean modern presentation.',
  },

  // ── Méditerranée & Moyen-Orient ─────────────────────────────────────────────
  {
    id: 'libanais',
    emoji: '🧆',
    label: 'Libanais',
    bread: 'pain pita fin et moelleux, pain libanais (marqué)',
    serving: 'grande assiette à partager, plateau de mezzé, bol en terre cuite',
    sauce: 'houmous, tahini, toum (ail), labneh',
    ambiance: 'warm Mediterranean colors, generous sharing plates, rustic clay and wood',
    cultural_context: 'Lebanese restaurant. Mezze, shawarma, falafel, manouché. Generous sharing plates, pita bread, tahini drizzle. Warm rustic Mediterranean presentation.',
  },
  {
    id: 'turc',
    emoji: '🫓',
    label: 'Turc',
    bread: 'pain pide (bateau), pain lavash, simit',
    serving: 'plateau en cuivre, assiette en terre cuite, grill',
    sauce: 'yaourt, sumac, piment d\\'Alep, grenade',
    ambiance: 'warm copper tones, grilled marks, aromatic spices, generous',
    cultural_context: 'Turkish restaurant. Kebabs, pide, lahmacun, grills. Copper trays, terracotta plates. Charred grill marks, warm spice colors.',
  },
  {
    id: 'grec',
    emoji: '🫒',
    label: 'Grec',
    bread: 'pain pita grec (épais, grillé)',
    serving: 'assiette blanche/bleue, papier kraft pour gyros, plat en terre cuite',
    sauce: 'tzatziki, huile d\\'olive, citron, origan',
    ambiance: 'Mediterranean blue and white, sun-drenched, fresh olive oil glow',
    cultural_context: 'Greek restaurant. Gyros, souvlaki, Greek salad, moussaka. Blue/white aesthetics, thick pita, tzatziki. Fresh Mediterranean sun-kissed feel.',
  },
  {
    id: 'marocain',
    emoji: '🫕',
    label: 'Marocain',
    bread: 'pain marocain rond (khobz), msemen',
    serving: 'tajine en terre cuite avec couvercle conique, plat en céramique peinte',
    sauce: 'chermoula, harissa, preserved lemon',
    ambiance: 'warm earthy tones, ornate zellige tiles, aromatic steam from tagine',
    cultural_context: 'Moroccan restaurant. Tagine, couscous, pastilla, harira. Terracotta tagine pot, ornate ceramics, colorful spices. Warm, fragrant, generous.',
  },
  {
    id: 'italien',
    emoji: '🍝',
    label: 'Italien',
    bread: 'focaccia, ciabatta, grissini',
    serving: 'assiette en céramique rustique, planche en bois d\\'olivier',
    sauce: 'sauce tomate San Marzano, pesto, huile d\\'olive extra vierge',
    ambiance: 'warm rustic Italian trattoria, terracotta, olive wood, sun-drenched Tuscany feel',
    cultural_context: 'Italian restaurant. Pasta, risotto, antipasti, tiramisu. Rustic ceramics, olive wood boards. Basil, parmesan, olive oil. Warm Mediterranean light.',
  },
  {
    id: 'espagnol',
    emoji: '🦐',
    label: 'Espagnol / Tapas',
    bread: 'pan con tomate, pain cristal',
    serving: 'petites assiettes en terre cuite (cazuelas), planche à partager',
    sauce: 'aïoli, romesco, huile d\\'olive pimentée',
    ambiance: 'warm rustic tavern, small sharing plates, convivial and colorful',
    cultural_context: 'Spanish restaurant. Tapas, paella, pintxos, patatas bravas. Small sharing plates, cazuelas en terre cuite. Convivial, colorful, Mediterranean warmth.',
  },

  // ── Français ────────────────────────────────────────────────────────────────
  {
    id: 'bistro',
    emoji: '🍷',
    label: 'Bistrot',
    bread: 'baguette tradition, pain de campagne',
    serving: 'assiette blanche classique, nappe à carreaux, ardoise',
    sauce: 'sauce au vin, béarnaise, beurre maître d\\'hôtel',
    ambiance: 'warm Parisian bistro, zinc bar, checkered tablecloth, cozy golden light',
    cultural_context: 'French bistro. Plat du jour, steak-frites, crème brûlée. White ceramic plates, classic French plating. Warm Parisian brasserie atmosphere.',
  },
  {
    id: 'gastronomique',
    emoji: '⭐',
    label: 'Gastronomique',
    bread: 'pain artisanal de chef, pas de pain visible sur l\\'assiette',
    serving: 'grande assiette blanche en porcelaine fine, bord doré',
    sauce: 'jus réduit, émulsion, coulis en points précis',
    ambiance: 'dark elegant matte slate, precise lighting, fine dining, Michelin-star feel',
    cultural_context: 'Fine dining / gastronomic restaurant. Precise artistic plating, wide white plates, micro-portions. Jus reduction dots, edible flowers only if intentional. Elegant, refined, minimalist.',
  },
  {
    id: 'creperie',
    emoji: '🥞',
    label: 'Crêperie',
    bread: 'crêpe fine au froment, galette de sarrasin',
    serving: 'assiette ronde, billig (crêpière), planche en bois',
    sauce: 'beurre salé, caramel au beurre salé, cidre',
    ambiance: 'warm Breton cottage feel, rustic wood, cozy and traditional',
    cultural_context: 'French crêperie. Thin crêpes (sweet) and galettes de sarrasin (savory). Folded or rolled presentation. Breton tradition, rustic warm atmosphere.',
  },
  {
    id: 'brasserie',
    emoji: '🍽️',
    label: 'Brasserie',
    bread: 'baguette, pain de seigle',
    serving: 'assiette blanche large, plateau de fruits de mer, nappe blanche',
    sauce: 'mayonnaise, aïoli, beurre citronné',
    ambiance: 'classic French brasserie, white tablecloth, elegant but relaxed, Art Deco accents',
    cultural_context: 'French brasserie. Choucroute, plateau de fruits de mer, steak tartare. Classic elegant white plates, white tablecloth. Art Deco atmosphere, refined but casual.',
  },

  // ── Mexicain & Latino ──────────────────────────────────────────────────────
  {
    id: 'mexicain',
    emoji: '🌮',
    label: 'Mexicain',
    bread: 'tortilla de maïs (small, soft, doubled), tortilla de blé pour burritos',
    serving: 'assiette colorée en céramique, panier avec papier, lime wedge',
    sauce: 'salsa verde, guacamole, crema, pico de gallo',
    ambiance: 'vibrant warm colors, rustic painted ceramics, festive and colorful',
    cultural_context: 'Mexican restaurant. IMPORTANT: "Tacos" here means AUTHENTIC MEXICAN TACOS — small open corn tortillas topped with meat, cilantro, onion, and lime. NOT French tacos. Burritos, quesadillas, guacamole. Colorful, fresh, festive.',
  },
  {
    id: 'bresilien',
    emoji: '🥩',
    label: 'Brésilien',
    bread: 'pão de queijo, farofa',
    serving: 'espeto (brochette), assiette large, planche à découper',
    sauce: 'chimichurri, vinaigrette, farofa',
    ambiance: 'warm churrascaria glow, grilled meats, generous and festive',
    cultural_context: 'Brazilian restaurant. Churrasco, feijoada, açaí. Grilled meats on skewers, generous portions. Warm festive atmosphere.',
  },
  {
    id: 'peruvien',
    emoji: '🐙',
    label: 'Péruvien',
    bread: 'pas de pain standard — maïs, pommes de terre',
    serving: 'assiette moderne blanche, bol en céramique',
    sauce: 'leche de tigre, ají amarillo, huancaína',
    ambiance: 'fresh coastal feel, vibrant citrus colors, modern Latin fusion',
    cultural_context: 'Peruvian restaurant. Ceviche, lomo saltado, causa. Fresh citrus-forward flavors, colorful modern plating. Coastal, vibrant, contemporary.',
  },

  // ── Afrique & Antilles ─────────────────────────────────────────────────────
  {
    id: 'africain',
    emoji: '🍲',
    label: 'Africain',
    bread: 'attiéké, foutou, semoule, injera (éthiopien)',
    serving: 'grande assiette à partager, bol profond, feuille de bananier',
    sauce: 'sauce arachide (mafé), sauce gombo, sauce tomate épicée',
    ambiance: 'warm earthy rich colors, generous family-style portions, vibrant and hearty',
    cultural_context: 'African restaurant. Mafé, yassa, thiéboudienne, attiéké. Generous portions, rich sauces, communal sharing style. Warm earth tones, hearty and vibrant.',
  },
  {
    id: 'antillais',
    emoji: '🌴',
    label: 'Antillais / Caribéen',
    bread: 'pain maison antillais, bokit (pain frit)',
    serving: 'assiette colorée, barquette, feuille de bananier',
    sauce: 'sauce chien, sauce colombo, piment',
    ambiance: 'tropical vibrant colors, Caribbean warmth, lush and festive',
    cultural_context: 'Caribbean/Antillean restaurant. Colombo, accras, boudin, poulet boucané. Tropical colors, banana leaf, plantain. Vibrant, generous, island warmth.',
  },

  // ── Autres concepts ────────────────────────────────────────────────────────
  {
    id: 'poke_bowl',
    emoji: '🥗',
    label: 'Poké / Bowl',
    bread: 'base riz sushi ou quinoa',
    serving: 'large bol rond vu du dessus, disposition géométrique en sections',
    sauce: 'sauce soja sucrée, mayo sriracha, ponzu, sésame',
    ambiance: 'bright healthy aesthetic, overhead shot, colorful geometric arrangement',
    cultural_context: 'Poke/bowl restaurant. Ingredients arranged in neat geometric sections, overhead view. Fresh, colorful, healthy. Hawaiian-inspired or açaí bowls.',
  },
  {
    id: 'brunch',
    emoji: '🥞',
    label: 'Brunch / Breakfast',
    bread: 'pain de mie toasté, pancakes, brioche, bagel',
    serving: 'grande assiette composée, planche en bois, mug en céramique',
    sauce: 'sirop d\\'érable, hollandaise, confiture artisanale',
    ambiance: 'bright warm morning light, cozy cafe atmosphere, Instagram-worthy abundance',
    cultural_context: 'Brunch restaurant. Eggs benedict, pancakes, avocado toast, French toast. Abundant composed plates, morning golden light. Cozy, photogenic, generous.',
  },
  {
    id: 'cafe',
    emoji: '☕',
    label: 'Café / Salon de thé',
    bread: 'pâtisseries, viennoiseries, cake',
    serving: 'tasse en céramique, soucoupe, petite assiette à dessert',
    sauce: 'latte art, chocolat chaud, crème fouettée',
    ambiance: 'cozy warm interior, soft natural light, intimate cafe atmosphere',
    cultural_context: 'Cafe/tea room. Coffee drinks, pastries, light snacks. Ceramic cups, saucers, cake stands. Cozy, intimate, warm natural light. NO TEXT on drink surfaces.',
  },
  {
    id: 'fruits_de_mer',
    emoji: '🦞',
    label: 'Fruits de Mer',
    bread: 'pain de seigle, blinis',
    serving: 'plateau de fruits de mer sur glace pilée, assiette blanche large',
    sauce: 'mayonnaise, mignonette, beurre citronné',
    ambiance: 'coastal fresh atmosphere, crushed ice, ocean blues, elegant seafood display',
    cultural_context: 'Seafood restaurant. Plateaux de fruits de mer, oysters, lobster, fish. Crushed ice, lemon, seaweed garnish. Fresh coastal elegance.',
  },
  {
    id: 'bbq',
    emoji: '🔥',
    label: 'BBQ / Grill',
    bread: 'cornbread, brioche bun, pain de maïs',
    serving: 'planche en bois rustique, plateau métallique, papier kraft',
    sauce: 'sauce BBQ fumée, coleslaw, pickles',
    ambiance: 'smoky rustic atmosphere, charred wood, warm amber tones, hearty portions',
    cultural_context: 'BBQ/grill restaurant. Smoked meats, ribs, pulled pork, brisket. Rustic wood boards, kraft paper. Smoky, charred, generous American BBQ style.',
  },
  {
    id: 'healthy',
    emoji: '🥬',
    label: 'Healthy / Végétarien',
    bread: 'pain complet, wrap aux graines, pas de pain',
    serving: 'bol en bambou, assiette en grès, packaging eco-friendly',
    sauce: 'vinaigrette légère, tahini, houmous',
    ambiance: 'bright natural light, earthy tones, green accents, clean minimalist',
    cultural_context: 'Healthy/vegetarian restaurant. Salads, bowls, smoothies, grain-based dishes. Natural materials, earth tones, green accents. Fresh, clean, plant-forward aesthetic.',
  },
];

// ── Lookup helpers ───────────────────────────────────────────────────────────

/** Map profile ID → CuisineProfile for O(1) access */
export const CUISINE_PROFILE_MAP: Record<string, CuisineProfile> =
  Object.fromEntries(CUISINE_PROFILES.map(p => [p.id, p]));

/** All valid profile IDs (for validation & UI dropdown) */
export const CUISINE_PROFILE_IDS = CUISINE_PROFILES.map(p => p.id);

/** Find profile by ID, fallback to undefined */
export function getCuisineProfile(id: string | null | undefined): CuisineProfile | undefined {
  if (!id) return undefined;
  return CUISINE_PROFILE_MAP[id];
}
`
);

// constants/presentationStyles.ts
fs.writeFileSync(
  path.join(srcDir, 'constants', 'presentationStyles.ts'),
  `export interface PresentationStyle {
  id: string;
  emoji: string;
  label: string;
  hint: string;
}

export const PRESENTATION_STYLES: PresentationStyle[] = [
  { id: 'french_bistro', emoji: '\\u{1F950}', label: 'Bistrot Français', hint: 'rustic French bistro presentation, checkered tablecloth, zinc bar, Parisian brasserie atmosphere' },
  { id: 'fine_dining', emoji: '\\u{1F37D}\\uFE0F', label: 'Gastronomique', hint: 'fine dining restaurant, white linen tablecloth, crystal glasses, elegant plating, upscale atmosphere' },
  { id: 'street_food', emoji: '\\u{1F959}', label: 'Street Food', hint: 'authentic street food stall, bold portions, kraft paper, food truck atmosphere, vibrant and casual' },
  { id: 'asian_fusion', emoji: '\\u{1F962}', label: 'Asiatique', hint: 'modern Asian fusion restaurant, sleek dark surfaces, neon accents, dynamic urban atmosphere' },
  { id: 'mediterranean', emoji: '\\u{1FAD2}', label: 'Méditerranéen', hint: 'Mediterranean coastal setting, blue and white tones, olive wood, terrace by the sea atmosphere' },
];

/** Find a style by matching its hint prefix in a stored description string */
export function findStyleByHint(description: string): PresentationStyle | null {
  if (!description) return null;
  return PRESENTATION_STYLES.find(s => description.startsWith(s.hint)) ?? null;
}
`
);

// Summary
console.log('✅ Auguste v2 src/ directory recreated successfully!');
console.log('\n📁 Files created:');
console.log('  ✓ App.tsx');
console.log('  ✓ main.tsx');
console.log('  ✓ index.css');
console.log('  ✓ types/index.ts');
console.log('  ✓ lib/supabase.ts');
console.log('  ✓ lib/auth.tsx');
console.log('  ✓ lib/i18n.tsx');
console.log('  ✓ hooks/useRestaurant.ts');
console.log('  ✓ components/layout/AppLayout.tsx');
console.log('  ✓ components/layout/BottomNav.tsx');
console.log('  ✓ components/layout/Sidebar.tsx');
console.log('  ✓ pages/LoginPage.tsx');
console.log('  ✓ pages/ProfilePage.tsx');
console.log('  ✓ pages/MenuPage.tsx');
console.log('  ✓ pages/PhotosPage.tsx');
console.log('  ✓ pages/ExportPage.tsx');
console.log('  ✓ constants/cuisineProfiles.ts');
console.log('  ✓ constants/presentationStyles.ts');
console.log('\n💾 Total: 18 files written');
console.log('🚀 Run: npm run dev');
