'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'

const statusStyles: Record<'info' | 'success' | 'error', string> = {
  info: 'text-zinc-600 dark:text-zinc-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
}

export default function AuthCallout() {
  const { loading, profile, isGuest, signInAsGuest, continueWithGoogle, signOut, refreshingProfile } = useAuth()
  const [actionState, setActionState] = useState<'idle' | 'pending'>('idle')
  const [status, setStatus] = useState<{ type: keyof typeof statusStyles; message: string } | null>(null)

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      setStatus(null)
      setActionState('pending')
      await action()
      setStatus({ type: 'success', message: successMessage })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'Não foi possível concluir esta ação. Tenta novamente.' })
    } finally {
      setActionState('idle')
    }
  }

  const primaryCta = !profile ? (
    <button
      onClick={() => handleAction(signInAsGuest, 'Entraste como convidado!')}
      disabled={loading || actionState === 'pending'}
      className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-amber-400 disabled:opacity-60"
    >
      {actionState === 'pending' && !profile ? 'A iniciar...' : 'Entrar como Convidado'}
    </button>
  ) : isGuest ? (
    <button
      onClick={() => handleAction(continueWithGoogle, 'Conta ligada com sucesso. Atualiza a página se necessário.')}
      disabled={actionState === 'pending'}
      className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-400 disabled:opacity-60"
    >
      {actionState === 'pending' ? 'A ligar conta...' : 'Ligar conta Google'}
    </button>
  ) : (
    <button
      onClick={() => handleAction(signOut, 'Sessão terminada.')}
      disabled={actionState === 'pending'}
      className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      Terminar sessão
    </button>
  )

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">Conta & Matchmaking</p>
          {loading ? (
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">A carregar sessão...</h3>
          ) : profile ? (
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {profile.display_name}{' '}
                {isGuest && <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">(Convidado)</span>}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                XP: {profile.experience_points} · XP global disponível após login permanente.
                {profile.last_seen && (
                  <> Último acesso{' '}{new Date(profile.last_seen).toLocaleDateString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</>
                )}
              </p>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Começa como convidado, sobe como campeão.</h3>
          )}
          {status && <p className={`mt-2 text-sm ${statusStyles[status.type]}`}>{status.message}</p>}
          {!status && refreshingProfile && <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">A sincronizar perfil...</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {primaryCta}
          {profile && !isGuest && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Liga mais identidades através das definições da tua conta Supabase.</p>
          )}
        </div>
      </div>
    </div>
  )
}
