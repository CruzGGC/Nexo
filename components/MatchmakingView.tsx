import { useState } from 'react'
import { generateMatchCode } from '@/lib/matchmaking'

interface MatchmakingViewProps {
  onJoinPublic: () => void
  onCreatePrivate: (code: string) => void
  onJoinPrivate: (code: string) => void
  onCancel: () => void
  status: string
  roomCode?: string
  title?: string
  description?: string
}

export function MatchmakingView({
  onJoinPublic,
  onCreatePrivate,
  onJoinPrivate,
  onCancel,
  status,
  roomCode,
  title = 'Modo Online',
  description = 'Escolhe como queres encontrar o teu oponente.'
}: MatchmakingViewProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode] = useState(generateMatchCode())
  const [view, setView] = useState<'menu' | 'create' | 'join'>('menu')

  const isSearching = status === 'queued' || status === 'joining' || status === 'matched'

  if (isSearching) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-md animate-in fade-in zoom-in duration-500">
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="relative mx-auto h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-20"></div>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 text-4xl shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              {status === 'matched' ? '✨' : '🔍'}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white">
              {status === 'matched' ? 'Adversário Encontrado!' : 'A procurar adversário...'}
            </h3>
            <p className="text-zinc-400">
              {status === 'matched'
                ? 'A preparar o jogo...'
                : 'Aguardando conexão...'}
            </p>
            {roomCode && (
              <div className="mt-4 inline-block rounded-lg bg-white/5 border border-white/10 px-4 py-2 font-mono text-sm font-bold text-zinc-300">
                Sala: {roomCode}
              </div>
            )}
          </div>
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-8 py-3 font-bold text-zinc-400 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-md animate-in fade-in zoom-in duration-500">
      {view === 'menu' && (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white">{title}</h2>
            <p className="text-zinc-400">
              {description}
            </p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={onJoinPublic}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-blue-500/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
            >
              <div className="rounded-xl bg-blue-500/20 p-4 text-2xl transition-colors group-hover:bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">🌍</div>
              <div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Procurar Jogo</h3>
                <p className="text-sm text-zinc-400 group-hover:text-zinc-300">Matchmaking rápido com qualquer jogador.</p>
              </div>
            </button>

            <button
              onClick={() => setView('create')}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-indigo-500/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
            >
              <div className="rounded-xl bg-indigo-500/20 p-4 text-2xl transition-colors group-hover:bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">🔑</div>
              <div>
                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Criar Sala Privada</h3>
                <p className="text-sm text-zinc-400 group-hover:text-zinc-300">Gera um código para convidar um amigo.</p>
              </div>
            </button>

            <button
              onClick={() => setView('join')}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-emerald-500/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            >
              <div className="rounded-xl bg-emerald-500/20 p-4 text-2xl transition-colors group-hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">👋</div>
              <div>
                <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Entrar com Código</h3>
                <p className="text-sm text-zinc-400 group-hover:text-zinc-300">Usa um código partilhado por um amigo.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white">Sala Privada</h3>
            <p className="text-zinc-400">Partilha este código com o teu amigo</p>
          </div>

          <div className="flex items-center justify-center gap-4 rounded-2xl bg-white/5 border border-white/10 p-8 shadow-inner">
            <code className="text-4xl font-black tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {generatedCode}
            </code>
          </div>

          <div className="grid gap-3">
            <button
              onClick={() => onCreatePrivate(generatedCode)}
              className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white transition-all hover:bg-indigo-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
              Aguardar Amigo
            </button>
            <button
              onClick={() => setView('menu')}
              className="w-full rounded-xl border border-white/10 py-4 font-bold text-zinc-400 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {view === 'join' && (
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white">Entrar em Sala</h3>
            <p className="text-zinc-400">Insere o código partilhado</p>
          </div>

          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            maxLength={6}
            className="w-full rounded-2xl border-2 border-white/10 bg-white/5 p-6 text-center text-3xl font-black tracking-widest outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-white placeholder:text-zinc-700"
          />

          <div className="grid gap-3">
            <button
              onClick={() => onJoinPrivate(inviteCode)}
              disabled={inviteCode.length < 6}
              className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white transition-all hover:bg-emerald-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              Entrar
            </button>
            <button
              onClick={() => setView('menu')}
              className="w-full rounded-xl border border-white/10 py-4 font-bold text-zinc-400 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
