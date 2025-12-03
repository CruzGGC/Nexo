'use client'

import { ErrorFallback } from '@/components/common'

export default function CrosswordError({
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
        title="Erro nas Palavras Cruzadas"
        showHomeButton={true}
      />
    </main>
  )
}
