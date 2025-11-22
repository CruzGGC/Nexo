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
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in duration-500">
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="relative mx-auto h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20 dark:bg-blue-500"></div>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-blue-50 text-4xl dark:bg-blue-900/30">
              {status === 'matched' ? '✨' : '🔍'}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {status === 'matched' ? 'Adversário Encontrado!' : 'A procurar adversário...'}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400">
              {status === 'matched' 
                ? 'A preparar o jogo...' 
                : 'Aguardando conexão...'}
            </p>
            {roomCode && (
              <div className="mt-4 inline-block rounded-lg bg-zinc-100 px-4 py-2 font-mono text-sm font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Sala: {roomCode}
              </div>
            )}
          </div>
          <button
            onClick={onCancel}
            className="rounded-xl border-2 border-zinc-200 px-8 py-3 font-bold text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in duration-500">
      {view === 'menu' && (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={onJoinPublic}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500"
            >
              <div className="rounded-xl bg-blue-50 p-4 text-2xl transition-colors group-hover:bg-blue-100 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/40">🌍</div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Procurar Jogo</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Matchmaking rápido com qualquer jogador.</p>
              </div>
            </button>

            <button
              onClick={() => setView('create')}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-indigo-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500"
            >
              <div className="rounded-xl bg-indigo-50 p-4 text-2xl transition-colors group-hover:bg-indigo-100 dark:bg-indigo-900/20 dark:group-hover:bg-indigo-900/40">🔑</div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Criar Sala Privada</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Gera um código para convidar um amigo.</p>
              </div>
            </button>

            <button
              onClick={() => setView('join')}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-emerald-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500"
            >
              <div className="rounded-xl bg-emerald-50 p-4 text-2xl transition-colors group-hover:bg-emerald-100 dark:bg-emerald-900/20 dark:group-hover:bg-emerald-900/40">👋</div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Entrar com Código</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Usa um código partilhado por um amigo.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Sala Privada</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Partilha este código com o teu amigo</p>
          </div>

          <div className="flex items-center justify-center gap-4 rounded-2xl bg-zinc-100 p-8 dark:bg-zinc-800/50">
            <code className="text-4xl font-black tracking-widest text-zinc-900 dark:text-zinc-50">
              {generatedCode}
            </code>
          </div>

          <div className="grid gap-3">
            <button
              onClick={() => onCreatePrivate(generatedCode)}
              className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white transition-all hover:bg-indigo-700 hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
            >
              Aguardar Amigo
            </button>
            <button
              onClick={() => setView('menu')}
              className="w-full rounded-xl border-2 border-zinc-200 py-4 font-bold text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {view === 'join' && (
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Entrar em Sala</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Insere o código partilhado</p>
          </div>

          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            maxLength={6}
            className="w-full rounded-2xl border-2 border-zinc-200 bg-transparent p-6 text-center text-3xl font-black tracking-widest outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-emerald-500"
          />

          <div className="grid gap-3">
            <button
              onClick={() => onJoinPrivate(inviteCode)}
              disabled={inviteCode.length < 6}
              className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white transition-all hover:bg-emerald-700 hover:scale-[1.02] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              Entrar
            </button>
            <button
              onClick={() => setView('menu')}
              className="w-full rounded-xl border-2 border-zinc-200 py-4 font-bold text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
