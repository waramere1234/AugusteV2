import { createContext, useContext, useState, type ReactNode } from 'react'

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
  'profile.saving': { fr: 'Sauvegarde...', en: 'Saving...' },
  'profile.google.placeholder': { fr: 'Chercher mon restaurant sur Google...', en: 'Search my restaurant on Google...' },
  'profile.google.search': { fr: 'Chercher', en: 'Search' },
  'profile.google.linked': { fr: 'Google Business lié', en: 'Google Business linked' },
  'profile.photo.change': { fr: 'Changer', en: 'Change' },
  'profile.google.disconnect': { fr: 'Dissocier', en: 'Disconnect' },
  'profile.google.reviews': { fr: 'avis', en: 'reviews' },
  'profile.google.hours': { fr: 'Horaires', en: 'Hours' },
  'profile.google.maps': { fr: 'Voir sur Google Maps', en: 'View on Google Maps' },
  'profile.google.notLinked': { fr: 'Importez vos infos depuis Google', en: 'Import your info from Google' },
  'profile.address': { fr: 'Adresse', en: 'Address' },
  'profile.phone': { fr: 'Téléphone', en: 'Phone' },
  'profile.description': { fr: 'Description', en: 'Description' },
  'profile.cuisine.search': { fr: 'Filtrer...', en: 'Filter...' },
  'profile.name.placeholder': { fr: 'Le Petit Bistrot...', en: 'My Restaurant...' },
  'profile.photo.add': { fr: 'Ajouter une photo', en: 'Add a photo' },
  'profile.google.applying': { fr: 'Import en cours...', en: 'Importing...' },
  'profile.google.linkedPartial': { fr: 'Google lié — données en cours de chargement', en: 'Google linked — loading data' },
  'profile.cuisine.noResults': { fr: 'Aucun type de cuisine trouvé', en: 'No cuisine type found' },
  'profile.photo.avatarLabel': { fr: 'Changer la photo du restaurant', en: 'Change restaurant photo' },
  'common.dismiss': { fr: 'Fermer', en: 'Dismiss' },
  'error.google.details': { fr: 'Impossible de récupérer les infos Google', en: 'Could not retrieve Google details' },
  'error.google.search': { fr: 'Erreur lors de la recherche', en: 'Search error' },
  'profile.google.noResults': { fr: 'Aucun résultat trouvé', en: 'No results found' },
  'profile.buyCredits': { fr: 'Acheter des crédits', en: 'Buy credits' },
  'profile.saved': { fr: 'Sauvegardé', en: 'Saved' },
  'error.unknown': { fr: 'Erreur inconnue', en: 'Unknown error' },
  'error.photo.tooLarge': { fr: 'Photo trop lourde (max 10 Mo)', en: 'Photo too large (max 10 MB)' },
  'error.photo.invalidType': { fr: 'Format non supporté (JPG, PNG, WebP)', en: 'Unsupported format (JPG, PNG, WebP)' },
  'profile.onboarding': { fr: 'Cherchez votre restaurant sur Google pour remplir automatiquement votre profil', en: 'Search your restaurant on Google to auto-fill your profile' },
  'profile.complete': { fr: 'Profil complet', en: 'Profile complete' },
  'profile.step.name': { fr: 'Nom', en: 'Name' },
  'profile.step.google': { fr: 'Google', en: 'Google' },
  'profile.step.cuisine': { fr: 'Cuisine', en: 'Cuisine' },

  // ── Menu ────────────────────────────────────────────────────────────────────
  'menu.title': { fr: 'Ma Carte', en: 'My Menu' },
  'menu.import.photo': { fr: 'Prendre en photo', en: 'Take a photo' },
  'menu.import.file': { fr: 'Importer un fichier', en: 'Upload a file' },
  'menu.import.link': { fr: 'Coller un lien', en: 'Paste a link' },
  'menu.edit': { fr: 'Éditer', en: 'Edit' },
  'menu.generate': { fr: 'Générer les photos', en: 'Generate photos' },
  'menu.generateAll': { fr: 'Générer toutes les photos', en: 'Generate all photos' },
  'menu.generateSelected': { fr: 'Générer la sélection', en: 'Generate selected' },
  'menu.editFirst': { fr: 'Éditer d\'abord', en: 'Edit first' },
  'menu.extracting': { fr: 'Extraction en cours...', en: 'Extracting...' },
  'menu.extracting.desc': { fr: 'Analyse de votre carte avec l\'IA...', en: 'Analyzing your menu with AI...' },
  'menu.empty': { fr: 'Importez votre menu pour commencer', en: 'Import your menu to get started' },
  'menu.items': { fr: 'plats', en: 'items' },
  'menu.all': { fr: 'Tous', en: 'All' },
  'menu.selectAll': { fr: 'Tout sélectionner', en: 'Select all' },
  'menu.deselectAll': { fr: 'Tout désélectionner', en: 'Deselect all' },
  'menu.import.go': { fr: 'Importer', en: 'Import' },
  'menu.import.photo.desc': { fr: 'Photographier votre carte', en: 'Photograph your menu' },
  'menu.import.file.desc': { fr: 'PDF ou image depuis votre galerie', en: 'PDF or image from gallery' },
  'menu.import.link.desc': { fr: 'Uber Eats, Deliveroo, Just Eat', en: 'Uber Eats, Deliveroo, Just Eat' },
  'menu.item.name': { fr: 'Nom du plat', en: 'Dish name' },
  'menu.item.desc': { fr: 'Description', en: 'Description' },
  'menu.item.price': { fr: 'Prix', en: 'Price' },
  'menu.item.category': { fr: 'Catégorie', en: 'Category' },

  // ── Photos ──────────────────────────────────────────────────────────────────
  'photos.title': { fr: 'Photos', en: 'Photos' },
  'photos.gallery': { fr: 'Galerie', en: 'Gallery' },
  'photos.pending': { fr: 'En attente', en: 'Pending' },
  'photos.regenerate': { fr: 'Régénérer', en: 'Regenerate' },
  'photos.download': { fr: 'Télécharger', en: 'Download' },
  'photos.empty': { fr: 'Aucune photo générée', en: 'No photos generated' },
  'photos.empty.desc': { fr: 'Importez un menu puis générez des photos IA', en: 'Import a menu then generate AI photos' },
  'photos.generating': { fr: 'Génération en cours...', en: 'Generating...' },

  // ── Export ──────────────────────────────────────────────────────────────────
  'export.title': { fr: 'Exporter', en: 'Export' },
  'export.pdf': { fr: 'Menu PDF', en: 'PDF Menu' },
  'export.zip': { fr: 'Photos ZIP', en: 'Photos ZIP' },
  'export.uber': { fr: 'CSV Uber Eats', en: 'CSV Uber Eats' },
  'export.deliveroo': { fr: 'CSV Deliveroo', en: 'CSV Deliveroo' },
  'export.web': { fr: 'Lien web + QR', en: 'Web link + QR' },
  'export.photosReady': { fr: 'photos prêtes', en: 'photos ready' },
  'export.pdf.desc': { fr: '5 thèmes visuels, prévisualisation', en: '5 visual themes, preview' },
  'export.zip.desc': { fr: 'Toutes les photos en haute résolution', en: 'All photos in high resolution' },
  'export.csv.desc': { fr: 'Format conforme pour import plateforme', en: 'Platform-ready import format' },
  'export.web.desc': { fr: 'Menu en ligne + QR code', en: 'Online menu + QR code' },
  'export.soon': { fr: 'Bientôt', en: 'Soon' },
  'export.chooseStyle': { fr: 'Choisir un thème', en: 'Choose a theme' },
  'export.chooseStyle.desc': { fr: 'Sélectionnez le style de votre menu PDF', en: 'Select the style of your PDF menu' },

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
