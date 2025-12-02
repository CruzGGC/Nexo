'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  showHomeButton?: boolean
}

export default function ErrorFallback({
  error,
  reset,
  title = 'Algo correu mal',
  showHomeButton = true
}: ErrorFallbackProps) {
  useEffect(() => {
    logger.error('ErrorBoundary caught error', error, {
      title,
      digest: error.digest
    })
  }, [error, title])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white">{title}</h2>

        {/* Error Message */}
        <p className="text-white/60 text-sm">
          Ocorreu um erro inesperado. Por favor, tenta novamente.
        </p>

        {/* Error Digest (for debugging) */}
        {error.digest && (
          <p className="text-white/30 text-xs font-mono">
            Código: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>

          {showHomeButton && (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
