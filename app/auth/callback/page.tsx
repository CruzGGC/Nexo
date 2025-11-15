export const dynamic = 'force-static'

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="max-w-md space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
          Autenticação
        </p>
        <h1 className="text-3xl font-bold">A confirmar sessão...</h1>
        <p>
          Podes fechar esta janela se ela não fechar automaticamente. A app irá atualizar o teu estado de sessão assim que a autenticação
          for concluída.
        </p>
      </div>
    </div>
  )
}
