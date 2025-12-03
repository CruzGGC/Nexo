'use client'

import { ErrorFallback } from '@/components/common'

export default function TicTacToeError({
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
        title="Erro no Jogo do Galo"
        showHomeButton={true}
      />
    </main>
  )
}
