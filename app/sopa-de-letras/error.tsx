'use client'

import ErrorFallback from '@/components/ErrorFallback'

export default function WordSearchError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex-1 flex items-center justify-center">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Erro na Sopa de Letras"
        showHomeButton={true}
      />
    </main>
  )
}
