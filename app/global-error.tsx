'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Note: Can't use logger here as it might not be loaded in global error context
    // Global errors occur when root layout fails, so we use console directly
    console.error('[GlobalError]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }, [error])

  return (
    <html lang="pt-PT">
      <body className="min-h-screen bg-[#030014] flex items-center justify-center p-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white">Erro Crítico</h2>

          {/* Error Message */}
          <p className="text-white/60 text-sm">
            Ocorreu um erro grave na aplicação. Por favor, recarrega a página.
          </p>

          {/* Error Digest */}
          {error.digest && (
            <p className="text-white/30 text-xs font-mono">
              Código: {error.digest}
            </p>
          )}

          {/* Reset Button */}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Aplicação
          </button>
        </div>
      </body>
    </html>
  )
}
