import { useState } from 'react'
import { generateMatchCode } from '@/lib/matchmaking'

interface MatchmakingViewProps {
  onJoinPublic: () => void
  onCreatePrivate: (code: string) => void
  onJoinPrivate: (code: string) => void
  onCancel: () => void
  status: string
  roomCode?: string
}

export function MatchmakingView({
  onJoinPublic,
  onCreatePrivate,
  onJoinPrivate,
  onCancel,
  status,
  roomCode
}: MatchmakingViewProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode] = useState(generateMatchCode())
  const [view, setView] = useState<'menu' | 'create' | 'join'>('menu')

  const isSearching = status === 'queued' || status === 'joining' || status === 'matched'

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-32 w-32">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
            <div className="absolute inset-2 animate-pulse rounded-full border border-blue-500/50"></div>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-blue-500/10 text-5xl backdrop-blur-sm border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              📡
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {status === 'matched' ? 'ALVO LOCALIZADO!' : 'A RASTREAR...'}
          </h2>
          <p className="text-slate-400 font-mono">
            {status === 'matched'
              ? 'INICIALIZANDO PROTOCOLO DE JOGO...'
              : 'AGUARDANDO CONEXÃO NEURAL...'}
          </p>
          {roomCode && (
            <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-6 py-2 font-mono text-lg text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              SALA: {roomCode}
            </div>
          )}
        </div>
        <button
          onClick={onCancel}
          className="rounded-full border border-white/10 px-8 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white hover:border-white/20"
        >
          CANCELAR
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">MODO ONLINE</h2>
        <p className="text-slate-400">
          Escolhe o teu protocolo de conexão.
        </p>
      </div>

      {view === 'menu' && (
        <div className="grid gap-4 w-full max-w-md">
          <button
            onClick={onJoinPublic}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-6 text-left backdrop-blur-md transition-all hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:-translate-y-1"
          >
            <div className="rounded-xl bg-blue-500/20 p-3 text-2xl ring-1 ring-blue-500/50 group-hover:scale-110 transition-transform">🌍</div>
            <div>
              <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">PROCURAR JOGO</h3>
              <p className="text-sm text-slate-400">Matchmaking global rápido.</p>
            </div>
          </button>

          <button
            onClick={() => setView('create')}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-6 text-left backdrop-blur-md transition-all hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:-translate-y-1"
          >
            <div className="rounded-xl bg-purple-500/20 p-3 text-2xl ring-1 ring-purple-500/50 group-hover:scale-110 transition-transform">🔑</div>
            <div>
              <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">CRIAR SALA PRIVADA</h3>
              <p className="text-sm text-slate-400">Gera um código de acesso.</p>
            </div>
          </button>

          <button
            onClick={() => setView('join')}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-6 text-left backdrop-blur-md transition-all hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-1"
          >
            <div className="rounded-xl bg-emerald-500/20 p-3 text-2xl ring-1 ring-emerald-500/50 group-hover:scale-110 transition-transform">👋</div>
            <div>
              <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">ENTRAR COM CÓDIGO</h3>
              <p className="text-sm text-slate-400">Usa um código existente.</p>
            </div>
          </button>
        </div>
      )}

      {view === 'create' && (
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-8 text-center backdrop-blur-md shadow-2xl">
          <div>
            <h3 className="text-xl font-bold text-white">A TUA SALA</h3>
            <p className="text-sm text-slate-400">Partilha este código de acesso.</p>
          </div>

          <div className="rounded-xl bg-black/50 border border-white/10 p-6 font-mono text-4xl font-bold tracking-[0.2em] text-purple-400 shadow-inner">
            {generatedCode}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setView('menu')}
              className="flex-1 rounded-xl border border-white/10 py-3 font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              VOLTAR
            </button>
            <button
              onClick={() => onCreatePrivate(generatedCode)}
              className="flex-1 rounded-xl bg-purple-600 py-3 font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] transition hover:bg-purple-500 hover:scale-105"
            >
              CRIAR SALA
            </button>
          </div>
        </div>
      )}

      {view === 'join' && (
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-8 text-center backdrop-blur-md shadow-2xl">
          <div>
            <h3 className="text-xl font-bold text-white">ENTRAR NA SALA</h3>
            <p className="text-sm text-slate-400">Insere o código de acesso.</p>
          </div>

          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-center font-mono text-3xl font-bold uppercase tracking-[0.2em] text-white outline-none transition focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] placeholder:text-slate-700"
            maxLength={6}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setView('menu')}
              className="flex-1 rounded-xl border border-white/10 py-3 font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              VOLTAR
            </button>
            <button
              onClick={() => onJoinPrivate(inviteCode)}
              disabled={inviteCode.length < 4}
              className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-[0_0_20px_rgba(5,150,105,0.3)] transition hover:bg-emerald-500 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              ENTRAR
            </button>
          </div>
        </div>
      )}

      {view === 'menu' && (
        <button
          onClick={onCancel}
          className="text-sm font-semibold text-slate-500 hover:text-white transition-colors"
        >
          VOLTAR AO MENU PRINCIPAL
        </button>
      )}
    </div>
  )
}
