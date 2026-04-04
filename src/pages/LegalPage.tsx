import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const TABS = [
  { path: '/cgu', label: 'CGU' },
  { path: '/mentions-legales', label: 'Mentions légales' },
  { path: '/confidentialite', label: 'Confidentialité' },
] as const

// ─── Placeholder values (to replace before launch) ──────────────────────────
const EDITOR = '[Nom de la société / personne]'
const SIRET = '[SIRET]'
const ADDRESS = '[Adresse postale]'
const EMAIL = 'contact@auguste.app'
const HOST = 'Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA'

function CGU() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[#2C2622]/60">Dernière mise à jour : avril 2026</p>

      <Section title="1. Objet">
        Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
        du service Auguste, accessible à l'adresse auguste-v2.vercel.app (ci-après « le Service »).
        En utilisant le Service, vous acceptez sans réserve les présentes CGU.
      </Section>

      <Section title="2. Description du Service">
        Auguste est un service en ligne permettant aux restaurateurs de générer des photos
        professionnelles de leurs plats par intelligence artificielle, à partir de leur carte de menu.
        Le Service comprend l'import de menu, la génération de photos IA, et l'export en différents formats.
      </Section>

      <Section title="3. Inscription et compte">
        L'accès au Service nécessite la création d'un compte avec une adresse email et un mot de passe.
        Vous êtes responsable de la confidentialité de vos identifiants. Chaque compte est personnel
        et ne peut être partagé.
      </Section>

      <Section title="4. Crédits et paiement">
        La génération de photos consomme des crédits. 3 crédits gratuits sont offerts à l'inscription.
        Des packs de crédits supplémentaires peuvent être achetés via Stripe. Les paiements sont
        effectués en euros, TVA incluse. Les crédits achetés sont valables sans limite de durée.
        Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne
        s'applique pas aux contenus numériques fournis immédiatement (photos générées).
      </Section>

      <Section title="5. Propriété intellectuelle">
        Les photos générées par le Service sont la propriété de l'utilisateur qui les a générées.
        L'utilisateur garantit disposer des droits sur les contenus qu'il importe (menus, photos).
        La marque Auguste, le logo et l'interface sont la propriété de l'éditeur.
      </Section>

      <Section title="6. Responsabilité">
        Le Service est fourni « en l'état ». L'éditeur s'efforce d'assurer la disponibilité du Service
        mais ne garantit pas un fonctionnement ininterrompu. Les photos générées par IA sont des
        illustrations et peuvent différer de la réalité. L'utilisateur reste responsable de l'usage
        qu'il fait des contenus générés.
      </Section>

      <Section title="7. Résiliation">
        L'utilisateur peut supprimer son compte à tout moment en contactant {EMAIL}.
        L'éditeur se réserve le droit de suspendre ou supprimer un compte en cas de violation des CGU.
      </Section>

      <Section title="8. Droit applicable">
        Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux compétents
        seront ceux du ressort du siège social de l'éditeur.
      </Section>
    </div>
  )
}

function MentionsLegales() {
  return (
    <div className="space-y-6">
      <Section title="Éditeur du site">
        <InfoLine label="Raison sociale" value={EDITOR} />
        <InfoLine label="SIRET" value={SIRET} />
        <InfoLine label="Adresse" value={ADDRESS} />
        <InfoLine label="Email" value={EMAIL} />
        <InfoLine label="Directeur de la publication" value={EDITOR} />
      </Section>

      <Section title="Hébergement">
        <InfoLine label="Hébergeur" value={HOST} />
        <InfoLine label="Base de données" value="Supabase Inc. — 970 Toa Payoh North #07-04, Singapore 318992" />
      </Section>

      <Section title="Propriété intellectuelle">
        L'ensemble du contenu du site (textes, interface, logo, code) est protégé par le droit
        d'auteur. Toute reproduction sans autorisation est interdite. Les photos générées appartiennent
        aux utilisateurs qui les ont créées.
      </Section>
    </div>
  )
}

function Confidentialite() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[#2C2622]/60">Dernière mise à jour : avril 2026</p>

      <Section title="1. Responsable du traitement">
        {EDITOR}, joignable à {EMAIL}.
      </Section>

      <Section title="2. Données collectées">
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#2C2622]/70">
          <li><strong>Compte :</strong> adresse email, mot de passe (chiffré)</li>
          <li><strong>Restaurant :</strong> nom, type de cuisine, adresse, téléphone (optionnel)</li>
          <li><strong>Menu :</strong> noms des plats, descriptions, prix, catégories</li>
          <li><strong>Photos :</strong> photos importées et photos générées par IA</li>
          <li><strong>Paiement :</strong> traité par Stripe — nous ne stockons aucune donnée bancaire</li>
        </ul>
      </Section>

      <Section title="3. Finalité du traitement">
        Vos données sont utilisées exclusivement pour :
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#2C2622]/70 mt-2">
          <li>Fournir le Service (génération de photos, export de menus)</li>
          <li>Gérer votre compte et vos crédits</li>
          <li>Traiter les paiements via Stripe</li>
          <li>Améliorer la qualité des photos générées</li>
        </ul>
      </Section>

      <Section title="4. Base légale">
        Le traitement repose sur l'exécution du contrat (article 6.1.b du RGPD) pour la fourniture
        du Service, et sur le consentement pour les éventuelles communications.
      </Section>

      <Section title="5. Durée de conservation">
        Vos données sont conservées tant que votre compte est actif. Après suppression du compte,
        les données sont effacées sous 30 jours. Les données de facturation sont conservées
        10 ans conformément aux obligations comptables.
      </Section>

      <Section title="6. Partage des données">
        Vos données ne sont jamais vendues. Elles sont partagées uniquement avec :
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#2C2622]/70 mt-2">
          <li><strong>Supabase</strong> — hébergement et base de données (EU / Singapour)</li>
          <li><strong>OpenAI</strong> — génération de photos IA (États-Unis)</li>
          <li><strong>Stripe</strong> — traitement des paiements (États-Unis)</li>
          <li><strong>Vercel</strong> — hébergement du site (États-Unis)</li>
        </ul>
      </Section>

      <Section title="7. Vos droits (RGPD)">
        Conformément au RGPD, vous disposez des droits suivants :
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#2C2622]/70 mt-2">
          <li><strong>Accès :</strong> obtenir une copie de vos données</li>
          <li><strong>Rectification :</strong> corriger vos données</li>
          <li><strong>Suppression :</strong> demander l'effacement de vos données</li>
          <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
          <li><strong>Opposition :</strong> vous opposer au traitement</li>
        </ul>
        <p className="text-sm text-[#2C2622]/70 mt-2">
          Pour exercer ces droits, contactez-nous à <strong>{EMAIL}</strong>.
          Vous pouvez également déposer une réclamation auprès de la CNIL (www.cnil.fr).
        </p>
      </Section>

      <Section title="8. Cookies">
        Auguste utilise uniquement des cookies techniques nécessaires au fonctionnement du Service
        (session d'authentification). Aucun cookie publicitaire ou de tracking n'est utilisé.
      </Section>
    </div>
  )
}

// ─── Shared UI components ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold font-serif text-[#2C2622] mb-2">{title}</h2>
      <div className="text-sm text-[#2C2622]/70 leading-relaxed">{children}</div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const isPlaceholder = value.startsWith('[')
  return (
    <p className="text-sm text-[#2C2622]/70">
      <span className="font-medium text-[#2C2622]/90">{label} :</span>{' '}
      <span className={isPlaceholder ? 'text-[#D4895C] font-medium' : ''}>{value}</span>
    </p>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

const CONTENT: Record<string, { title: string; Component: () => React.ReactElement }> = {
  '/cgu': { title: "Conditions Générales d'Utilisation", Component: CGU },
  '/mentions-legales': { title: 'Mentions légales', Component: MentionsLegales },
  '/confidentialite': { title: 'Politique de confidentialité', Component: Confidentialite },
}

export function LegalPage() {
  const { pathname } = useLocation()
  const current = CONTENT[pathname] ?? CONTENT['/cgu']
  const { title, Component } = current

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-lg border-b border-[#C9A961]/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link to="/" className="text-[#2C2622]/40 hover:text-[#C9A961] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[#2C2622]">Auguste</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <div className="flex gap-1 bg-[#F0EDE8] p-1 rounded-xl">
          {TABS.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 text-center py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                pathname === tab.path
                  ? 'bg-white text-[#2C2622] shadow-sm'
                  : 'text-[#2C2622]/40 hover:text-[#2C2622]/60'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        <h2 className="text-xl font-bold font-serif text-[#2C2622] mb-6">{title}</h2>
        <Component />
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-5 pb-10 pt-4 border-t border-[#C9A961]/10">
        <p className="text-xs text-[#2C2622]/30 text-center">
          &copy; {new Date().getFullYear()} Auguste. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
