'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from './AuthProvider'
import Link from 'next/link'
import { Loader2, Shield, LogOut } from 'lucide-react'

const statusStyles: Record<'info' | 'success' | 'error', string> = {
  info: 'text-white/60',
  success: 'text-green-400',
  error: 'text-red-400',
}

export default function AuthCallout() {
  const {
    loading,
    profile,
    isGuest,
    signInAsGuest,
    continueWithGoogle,
    linkEmailIdentity,
    signOut,
    refreshingProfile
  } = useAuth()
  const [actionState, setActionState] = useState<'idle' | 'pending'>('idle')
  const [status, setStatus] = useState<{ type: keyof typeof statusStyles; message: string } | null>(null)
  const [emailValue, setEmailValue] = useState('')
  const [emailState, setEmailState] = useState<'idle' | 'pending'>('idle')
  const [emailStatus, setEmailStatus] = useState<{ type: keyof typeof statusStyles; message: string } | null>(null)

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
    <Link
      href="/login"
      className="rounded-xl bg-white text-black px-6 py-3 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:shadow-white/20 flex items-center gap-2"
    >
      Entrar / Registar
    </Link>
  ) : isGuest ? (
    <button
      onClick={() => handleAction(continueWithGoogle, 'Conta ligada com sucesso. Atualiza a página se necessário.')}
      disabled={actionState === 'pending'}
      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-blue-500/30 disabled:opacity-60 disabled:hover:scale-100"
    >
      {actionState === 'pending' ? <Loader2 className="animate-spin" size={20} /> : 'Ligar conta Google'}
    </button>
  ) : (
    <button
      onClick={() => handleAction(signOut, 'Sessão terminada.')}
      disabled={actionState === 'pending'}
      className="rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-white/10 disabled:opacity-60 disabled:hover:scale-100 flex items-center gap-2"
    >
      <LogOut size={16} />
      Terminar sessão
    </button>
  )

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!emailValue) {
      setEmailStatus({ type: 'error', message: 'Indica um email válido primeiro.' })
      return
    }

    try {
      setEmailStatus(null)
      setEmailState('pending')
      await linkEmailIdentity(emailValue)
      setEmailStatus({
        type: 'success',
        message: 'Enviámos um email de confirmação. Verifica a caixa de entrada para concluir a migração.'
      })
      setEmailValue('')
    } catch (error) {
      console.error(error)
      setEmailStatus({
        type: 'error',
        message: 'Não foi possível enviar o email. Confirma o endereço e tenta novamente.'
      })
    } finally {
      setEmailState('idle')
    }
  }

  return (
    <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
            <Shield size={14} />
            Conta & Matchmaking
          </p>
          {loading ? (
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              A carregar sessão...
            </h3>
          ) : profile ? (
            <div>
              <h3 className="text-xl font-bold text-white">
                {profile.display_name}{' '}
                {isGuest && <span className="text-sm font-normal text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 ml-2">Convidado</span>}
              </h3>
              <p className="text-sm text-white/40">
                XP: <span className="text-white font-bold">{profile.experience_points}</span> · XP global disponível após login permanente.
              </p>
            </div>
          ) : (
            <h3 className="text-xl font-bold text-white">Começa como convidado, sobe como campeão.</h3>
          )}

          {status && <p className={`mt-2 text-sm font-medium ${statusStyles[status.type]}`}>{status.message}</p>}
          {!status && refreshingProfile && <p className="mt-2 text-sm text-white/40 animate-pulse">A sincronizar perfil...</p>}

          {profile && isGuest && (
            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-3 rounded-2xl bg-white/5 border border-white/5 p-4">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                Converter para email permanente
              </label>
              <p className="text-sm text-white/60">
                Enviaremos um email de verificação via Supabase. Depois de confirmar,
                poderás definir uma palavra-passe e manter todo o teu progresso.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={emailValue}
                  onChange={event => setEmailValue(event.target.value)}
                  placeholder="exemplo@email.com"
                  className="flex-1 rounded-xl bg-black/20 border border-white/10 px-4 py-2 text-sm text-white outline-none transition-all focus:border-blue-500 focus:bg-black/40"
                />
                <button
                  type="submit"
                  disabled={emailState === 'pending'}
                  className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-500 disabled:opacity-60"
                >
                  {emailState === 'pending' ? <Loader2 className="animate-spin" size={16} /> : 'Enviar código'}
                </button>
              </div>
              {emailStatus && <p className={`text-sm font-medium ${statusStyles[emailStatus.type]}`}>{emailStatus.message}</p>}
            </form>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {primaryCta}
          {profile && !isGuest && (
            <p className="text-xs text-white/40 max-w-[200px] text-right">Liga mais identidades através das definições da tua conta Supabase.</p>
          )}
        </div>
      </div>
    </div>
  )
}
