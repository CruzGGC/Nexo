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
  const [generatedCode, setGeneratedCode] = useState(generateMatchCode())
  const [view, setView] = useState<'menu' | 'create' | 'join'>('menu')

  const isSearching = status === 'queued' || status === 'joining' || status === 'matched'

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-400 opacity-20"></div>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-sky-100 text-4xl dark:bg-sky-900/30">
              📡
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {status === 'matched' ? 'Adversário Encontrado!' : 'A procurar adversário...'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {status === 'matched' 
              ? 'A preparar o tabuleiro...' 
              : 'Aguardando conexão...'}
          </p>
          {roomCode && (
            <div className="mt-4 rounded-lg bg-slate-100 px-4 py-2 font-mono text-sm dark:bg-slate-800">
              Sala: {roomCode}
            </div>
          )}
        </div>
        <button
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Modo Online</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Escolhe como queres encontrar o teu oponente.
        </p>
      </div>

      {view === 'menu' && (
        <div className="grid gap-4 w-full max-w-md">
          <button
            onClick={onJoinPublic}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-sky-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
          >
            <div className="rounded-xl bg-sky-100 p-3 text-2xl dark:bg-sky-900/30">🌍</div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Procurar Jogo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Matchmaking rápido com qualquer jogador.</p>
            </div>
          </button>

          <button
            onClick={() => setView('create')}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-indigo-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
          >
            <div className="rounded-xl bg-indigo-100 p-3 text-2xl dark:bg-indigo-900/30">🔑</div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Criar Sala Privada</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gera um código para convidar um amigo.</p>
            </div>
          </button>

          <button
            onClick={() => setView('join')}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-emerald-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
          >
            <div className="rounded-xl bg-emerald-100 p-3 text-2xl dark:bg-emerald-900/30">👋</div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Entrar com Código</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tens um código? Cola-o aqui.</p>
            </div>
          </button>
        </div>
      )}

      {view === 'create' && (
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">A tua Sala</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Partilha este código com o teu amigo.</p>
          </div>
          
          <div className="rounded-xl bg-slate-100 p-4 font-mono text-3xl font-bold tracking-widest text-slate-900 dark:bg-slate-800 dark:text-white">
            {generatedCode}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setView('menu')}
              className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Voltar
            </button>
            <button
              onClick={() => onCreatePrivate(generatedCode)}
              className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-700 hover:scale-105"
            >
              Criar Sala
            </button>
          </div>
        </div>
      )}

      {view === 'join' && (
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Entrar na Sala</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cola o código que recebeste.</p>
          </div>
          
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-center font-mono text-2xl font-bold uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500"
            maxLength={6}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setView('menu')}
              className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Voltar
            </button>
            <button
              onClick={() => onJoinPrivate(inviteCode)}
              disabled={inviteCode.length < 4}
              className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-700 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {view === 'menu' && (
        <button
          onClick={onCancel}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Voltar ao Menu Principal
        </button>
      )}
    </div>
  )
}
