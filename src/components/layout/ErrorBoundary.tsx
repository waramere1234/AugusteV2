import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#D4895C]/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-[#D4895C]" />
          </div>
          <h1 className="text-xl font-bold font-serif text-[#2C2622] mb-2">
            Oups, quelque chose a planté
          </h1>
          <p className="text-sm text-[#2C2622]/50 mb-8">
            Pas de panique — rechargez la page pour reprendre.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A961] text-white text-sm font-semibold rounded-xl shadow-[0_4px_16px_rgba(201,169,97,0.3)] active:scale-95 transition-all"
          >
            <RefreshCw size={16} />
            Recharger la page
          </button>
        </div>
      </div>
    )
  }
}
