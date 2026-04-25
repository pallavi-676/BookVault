import React from 'react'
import { Library, RefreshCw, ChevronLeft } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bookvault-surface flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-8 text-red-500">
            <Library className="opacity-40" size={48} />
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-bookvault-primary mb-4">
            Something went wrong
          </h1>
          
          <p className="text-on-surface-variant max-w-md mb-10 leading-relaxed">
            The application encountered an unexpected error while rendering this page. 
            This usually happens if storage is blocked by another tab or a file is corrupted.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-bookvault-primary text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-bookvault-primary-container transition-all shadow-premium"
            >
              <RefreshCw size={18} />
              <span>Retry Page</span>
            </button>
            <button 
              onClick={this.handleReset}
              className="px-8 py-3 border border-outline-variant text-bookvault-primary rounded-full font-bold flex items-center justify-center gap-2 hover:bg-bookvault-surface-low transition-all"
            >
              <ChevronLeft size={18} />
              <span>Back to Library</span>
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 p-4 bg-black/5 rounded-xl text-left max-w-2xl overflow-auto">
              <p className="text-[10px] font-mono opacity-60 uppercase mb-2">Developer info:</p>
              <pre className="text-xs font-mono text-red-600 dark:text-red-400">
                {this.state.error?.toString()}
              </pre>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
